import { ClockTimer } from '@colyseus/timer';
import { CrewSystemSetupInfo, PlayerShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { GameState } from 'src/state/GameState';
import { PlayerShip } from 'src/state/PlayerShip';
import { IdProvider } from 'src/types/IdProvider';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EngineerState, generationDurationByReactorPower } from '../engineer/EngineerState';

const minimalCrewSetup: CrewSystemSetupInfo = {
    cards: ['exampleNoTarget', 'exampleNoTarget'],
    initialPowerLevel: 3,
    maxPowerLevel: 5,
    initialHandSize: 0,
    health: 100,
    maxHealth: 100,
};

const defaultSetup: PlayerShipSetupInfo = {
    name: 'Player',
    position: { x: 0, y: 0, angle: 0 },
    hull: { initialPowerLevel: 3, maxPowerLevel: 5, health: 100, maxHealth: 100 },
    reactor: { initialPowerLevel: 3, maxPowerLevel: 5, health: 100, maxHealth: 100 },
    helm: { ...minimalCrewSetup },
    science: { ...minimalCrewSetup },
    tactical: { ...minimalCrewSetup, numSlots: 2 },
    engineer: { ...minimalCrewSetup },
};

function createTestShip(currentTime = 0) {
    let nextId = 1;
    const idPool: IdProvider = {
        getId: () => String(nextId++),
        releaseId: () => {},
    };
    const clock = new ClockTimer(false);
    clock.currentTime = currentTime;
    const gameState = new GameState(idPool, clock);
    const ship = new PlayerShip(gameState, defaultSetup);
    gameState.add(ship);
    return { ship, gameState, clock };
}

/**
 * Collect the names of systems that receive a generate.trigger() call,
 * by spying on each crew system's generate.trigger method.
 */
function spyOnGeneration(ship: PlayerShip) {
    const generated: string[] = [];

    for (const tile of ship.engineerState.systems) {
        vi.spyOn(tile.systemState.generate, 'trigger').mockImplementation(() => {
            generated.push(tile.system);
        });
    }

    return generated;
}

/**
 * Advance time and call update, stepping through in increments to
 * ensure cooldown completions are properly processed.
 */
function advanceTime(gameState: GameState, clock: ClockTimer, engineer: EngineerState, ms: number, step = 100) {
    const targetTime = clock.currentTime + ms;
    while (clock.currentTime < targetTime) {
        clock.currentTime = Math.min(clock.currentTime + step, targetTime);
        gameState.currentTime = clock.currentTime;
        engineer.update(clock.currentTime);
    }
}

// generationSequence = [0, 2, 4, 5, 3, 1]
// systems indices: 0=hull, 1=reactor, 2=helm, 3=science, 4=tactical, 5=engineer
//
// So sequence of systems by name: hull, helm, tactical, engineer, science, reactor.

/** Per-system generation duration at the reactor power level used in tests. */
const slotDuration = generationDurationByReactorPower[defaultSetup.reactor.initialPowerLevel];

describe('EngineerState generation priority', () => {
    let ship: PlayerShip;
    let gameState: GameState;
    let clock: ClockTimer;
    let engineer: EngineerState;

    beforeEach(() => {
        const ctx = createTestShip(0);
        ship = ctx.ship;
        gameState = ctx.gameState;
        clock = ctx.clock;
        engineer = ship.engineerState;
    });

    describe('normal generation (no priority)', () => {
        it('should generate for each system in sequence order', () => {
            const generated = spyOnGeneration(ship);

            // First call at t=0 starts hull generation (no trigger yet).
            engineer.update(0);
            expect(generated).toEqual([]);

            advanceTime(gameState, clock, engineer, slotDuration);
            expect(generated).toEqual(['hull']);

            advanceTime(gameState, clock, engineer, slotDuration);
            expect(generated).toEqual(['hull', 'helm']);

            // Complete the rest of the cycle.
            advanceTime(gameState, clock, engineer, slotDuration);
            expect(generated).toEqual(['hull', 'helm', 'tactical']);

            advanceTime(gameState, clock, engineer, slotDuration);
            expect(generated).toEqual(['hull', 'helm', 'tactical', 'engineer']);

            advanceTime(gameState, clock, engineer, slotDuration);
            expect(generated).toEqual(['hull', 'helm', 'tactical', 'engineer', 'science']);

            advanceTime(gameState, clock, engineer, slotDuration);
            expect(generated).toEqual(['hull', 'helm', 'tactical', 'engineer', 'science', 'reactor']);
        });
    });

    describe('with generationPriority effect', () => {
        it('should trigger priority system after every other system generates', () => {
            const generated = spyOnGeneration(ship);

            // Apply generationPriority to the science tile (systems index 3).
            const scienceTile = engineer.systems.find(t => t.system === 'science')!;
            scienceTile.addEffect('generationPriority');

            // Start at t=0. Hull starts generating.
            engineer.update(0);
            expect(generated).toEqual([]);

            // hull completes → science also generates.
            advanceTime(gameState, clock, engineer, slotDuration);
            expect(generated).toEqual(['hull', 'science']);

            // helm completes → science also generates.
            advanceTime(gameState, clock, engineer, slotDuration);
            expect(generated).toEqual(['hull', 'science', 'helm', 'science']);
        });

        it('should skip the priority system original slot in the sequence', () => {
            const generated = spyOnGeneration(ship);

            // Apply generationPriority to the science tile.
            // Normal sequence: hull, helm, tactical, engineer, science, reactor
            // With priority on science: hull, helm, tactical, engineer, [science skipped], reactor
            const scienceTile = engineer.systems.find(t => t.system === 'science')!;
            scienceTile.addEffect('generationPriority');

            engineer.update(0);

            // Run through the full cycle: 5 active slots (science slot skipped).
            advanceTime(gameState, clock, engineer, 5 * slotDuration);

            // Expected: each active slot triggers its system + science.
            // hull+science, helm+science, tactical+science, engineer+science, reactor+science
            // science slot is skipped, so science doesn't generate from its own slot.
            expect(generated).toEqual([
                'hull', 'science',
                'helm', 'science',
                'tactical', 'science',
                'engineer', 'science',
                'reactor', 'science',
            ]);
        });

        it('should resume normal generation after effect expires', () => {
            const generated = spyOnGeneration(ship);

            const scienceTile = engineer.systems.find(t => t.system === 'science')!;
            scienceTile.addEffect('generationPriority');

            // Read the actual expiry time from the applied effect rather than
            // relying on the hard-coded duration constant.
            const effectEndTime = scienceTile.effects.find(e => e.type === 'generationPriority')!.progress!.endTime;

            engineer.update(0);
            advanceTime(gameState, clock, engineer, effectEndTime);
            expect(scienceTile.hasEffect('generationPriority')).toBe(false);

            generated.length = 0;

            // Run through one full 6-slot cycle.
            advanceTime(gameState, clock, engineer, 6 * slotDuration);

            // With priority active science generated after every other system (5 times/cycle).
            // After expiry it should appear exactly once — only in its own sequence slot.
            expect(generated.filter(s => s === 'science')).toHaveLength(1);
        });

        it('should not trigger bonus generation on the priority system itself', () => {
            const generated = spyOnGeneration(ship);

            // Apply generationPriority to hull (systems index 0, first in sequence).
            const hullTile = engineer.systems.find(t => t.system === 'hull')!;
            hullTile.addEffect('generationPriority');

            // Hull's own slot (index 0) is first in sequence, so it gets skipped.
            // Helm starts generating instead.
            engineer.update(0);
            advanceTime(gameState, clock, engineer, slotDuration);

            // Helm generates, then hull gets bonus. Hull should NOT double-generate.
            expect(generated).toEqual(['helm', 'hull']);
        });

        it('should persist through system tile swaps', () => {
            const generated = spyOnGeneration(ship);

            // Apply generationPriority to science.
            const scienceTile = engineer.systems.find(t => t.system === 'science')!;
            scienceTile.addEffect('generationPriority');

            // Start generation.
            engineer.update(0);
            advanceTime(gameState, clock, engineer, slotDuration);
            expect(generated).toEqual(['hull', 'science']);

            generated.length = 0;

            // Swap science tile to a different position.
            const scienceIndex = engineer.systems.indexOf(scienceTile);
            const otherIndex = scienceIndex % 2 === 0 ? scienceIndex + 1 : scienceIndex - 1;
            const otherTile = engineer.systems[otherIndex];
            engineer.systems[scienceIndex] = otherTile;
            engineer.systems[otherIndex] = scienceTile;
            engineer.onSystemsSwapped(scienceIndex, otherIndex);

            // Advance through two more slots. science fires first (it is now at
            // the current generating position after the swap), then tactical fires
            // and science gets a bonus — confirming the effect follows the tile.
            advanceTime(gameState, clock, engineer, 2 * slotDuration);
            expect(generated).toEqual(['science', 'tactical', 'science']);
        });
    });
});
