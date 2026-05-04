import { ClockTimer } from '@colyseus/timer';
import { CrewSystemSetupInfo, PlayerShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IdProvider } from '../types/IdProvider';
import { EngineerState } from './EngineerState';
import { GameState } from './GameState';
import { PlayerShip } from './PlayerShip';

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
    sensors: { ...minimalCrewSetup },
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
function advanceTime(clock: ClockTimer, engineer: EngineerState, ms: number, step = 100) {
    const targetTime = clock.currentTime + ms;
    while (clock.currentTime < targetTime) {
        clock.currentTime = Math.min(clock.currentTime + step, targetTime);
        engineer.update(clock.currentTime);
    }
}

// generationSequence = [0, 2, 4, 5, 3, 1]
// systems indices: 0=hull, 1=reactor, 2=helm, 3=sensors, 4=tactical, 5=engineer
//
// So sequence of systems by name: hull, helm, tactical, engineer, sensors, reactor.
// At reactor power 3 → per-system duration = 2500ms.

describe('EngineerState generation priority', () => {
    let ship: PlayerShip;
    let clock: ClockTimer;
    let engineer: EngineerState;

    beforeEach(() => {
        const ctx = createTestShip(0);
        ship = ctx.ship;
        clock = ctx.clock;
        engineer = ship.engineerState;
    });

    describe('normal generation (no priority)', () => {
        it('should generate for each system in sequence order', () => {
            const generated = spyOnGeneration(ship);

            // Reactor power 3 → per-system duration = 2500ms.
            // First call at t=0 starts hull generation (no trigger yet).
            engineer.update(0);
            expect(generated).toEqual([]);

            // At t=2500, hull completes and helm starts.
            advanceTime(clock, engineer, 2500);
            expect(generated).toEqual(['hull']);

            // At t=5000, helm completes and tactical starts.
            advanceTime(clock, engineer, 2500);
            expect(generated).toEqual(['hull', 'helm']);

            // Complete the rest of the cycle.
            advanceTime(clock, engineer, 2500);
            expect(generated).toEqual(['hull', 'helm', 'tactical']);

            advanceTime(clock, engineer, 2500);
            expect(generated).toEqual(['hull', 'helm', 'tactical', 'engineer']);

            advanceTime(clock, engineer, 2500);
            expect(generated).toEqual(['hull', 'helm', 'tactical', 'engineer', 'sensors']);

            advanceTime(clock, engineer, 2500);
            expect(generated).toEqual(['hull', 'helm', 'tactical', 'engineer', 'sensors', 'reactor']);
        });
    });

    describe('with generationPriority effect', () => {
        it('should trigger priority system after every other system generates', () => {
            const generated = spyOnGeneration(ship);

            // Apply generationPriority to the sensors tile (systems index 3).
            const sensorsTile = engineer.systems.find(t => t.system === 'sensors')!;
            sensorsTile.addEffect('generationPriority');

            // Start at t=0. Hull starts generating.
            engineer.update(0);
            expect(generated).toEqual([]);

            // t=2500: hull completes → sensors also generates.
            advanceTime(clock, engineer, 2500);
            expect(generated).toEqual(['hull', 'sensors']);

            // t=5000: helm completes → sensors also generates.
            advanceTime(clock, engineer, 2500);
            expect(generated).toEqual(['hull', 'sensors', 'helm', 'sensors']);
        });

        it('should skip the priority system original slot in the sequence', () => {
            const generated = spyOnGeneration(ship);

            // Apply generationPriority to the sensors tile.
            // Normal sequence: hull, helm, tactical, engineer, sensors, reactor
            // With priority on sensors: hull, helm, tactical, engineer, [sensors skipped], reactor
            const sensorsTile = engineer.systems.find(t => t.system === 'sensors')!;
            sensorsTile.addEffect('generationPriority');

            engineer.update(0);

            // Run through the full cycle: 5 active slots × 2500ms = 12500ms total.
            advanceTime(clock, engineer, 12500);

            // Expected: each active slot triggers its system + sensors.
            // hull+sensors, helm+sensors, tactical+sensors, engineer+sensors, reactor+sensors
            // Sensors slot is skipped, so sensors doesn't generate from its own slot.
            expect(generated).toEqual([
                'hull', 'sensors',
                'helm', 'sensors',
                'tactical', 'sensors',
                'engineer', 'sensors',
                'reactor', 'sensors',
            ]);
        });

        it('should resume normal generation after effect expires', () => {
            const generated = spyOnGeneration(ship);

            const sensorsTile = engineer.systems.find(t => t.system === 'sensors')!;
            sensorsTile.addEffect('generationPriority');

            // Read the actual expiry time from the applied effect rather than
            // relying on the hard-coded duration constant.
            const effectEndTime = sensorsTile.effects.find(e => e.type === 'generationPriority')!.progress!.endTime;

            engineer.update(0);
            advanceTime(clock, engineer, effectEndTime);
            expect(sensorsTile.hasEffect('generationPriority')).toBe(false);

            generated.length = 0;

            // Run through one full 6-slot cycle.
            advanceTime(clock, engineer, 6 * 2500);

            // With priority active sensors generated after every other system (5 times/cycle).
            // After expiry it should appear exactly once — only in its own sequence slot.
            expect(generated.filter(s => s === 'sensors')).toHaveLength(1);
        });

        it('should not trigger bonus generation on the priority system itself', () => {
            const generated = spyOnGeneration(ship);

            // Apply generationPriority to hull (systems index 0, first in sequence).
            const hullTile = engineer.systems.find(t => t.system === 'hull')!;
            hullTile.addEffect('generationPriority');

            // Hull's own slot (index 0) is first in sequence, so it gets skipped.
            // Helm starts generating instead.
            engineer.update(0);
            advanceTime(clock, engineer, 2500);

            // Helm generates, then hull gets bonus. Hull should NOT double-generate.
            expect(generated).toEqual(['helm', 'hull']);
        });

        it('should persist through system tile swaps', () => {
            const generated = spyOnGeneration(ship);

            // Apply generationPriority to sensors.
            const sensorsTile = engineer.systems.find(t => t.system === 'sensors')!;
            sensorsTile.addEffect('generationPriority');

            // Start generation.
            engineer.update(0);
            advanceTime(clock, engineer, 2500);
            expect(generated).toEqual(['hull', 'sensors']);

            generated.length = 0;

            // Swap sensors tile to a different position.
            const sensorsIndex = engineer.systems.indexOf(sensorsTile);
            const otherIndex = sensorsIndex % 2 === 0 ? sensorsIndex + 1 : sensorsIndex - 1;
            const otherTile = engineer.systems[otherIndex];
            engineer.systems[sensorsIndex] = otherTile;
            engineer.systems[otherIndex] = sensorsTile;
            engineer.onSystemsSwapped(sensorsIndex, otherIndex);

            // Advance through two more slots. Sensors fires first (it is now at
            // the current generating position after the swap), then tactical fires
            // and sensors gets a bonus — confirming the effect follows the tile.
            advanceTime(clock, engineer, 2 * 2500);
            expect(generated).toEqual(['sensors', 'tactical', 'sensors']);
        });
    });
});
