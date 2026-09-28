import { ClockTimer } from '@colyseus/timer';
import { GameState } from 'src/state/GameState';
import { PlayerShip } from 'src/state/PlayerShip';
import { Ship } from 'src/state/Ship';
import { shipSetup } from 'src/testUtils';
import { IdProvider } from 'src/types/IdProvider';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generationDurationByReactorPower } from '../ReactorState';

const defaultSetup = shipSetup(undefined);

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
        vi.spyOn(tile.systemState.scheduledDraw, 'invoke').mockImplementation(() => {
            generated.push(tile.system);
            return true;
        });
    }

    return generated;
}

/**
 * Advance time and call update, stepping through in increments to
 * ensure cooldown completions are properly processed.
 */
function advanceTime(gameState: GameState, clock: ClockTimer, ship: Ship, ms: number, step = 100) {
    const targetTime = clock.currentTime + ms;
    while (clock.currentTime < targetTime) {
        clock.currentTime = Math.min(clock.currentTime + step, targetTime);
        gameState.currentTime = clock.currentTime;
        ship.tick(step, clock.currentTime);
    }
}

// generationSequence = [0, 2, 4, 5, 3, 1]
// systems indices: 0=hull, 1=reactor, 2=helm, 3=science, 4=tactical, 5=engineer
//
// So sequence of systems by name: hull, helm, tactical, engineer, science, reactor.

const defaultReactorPower = defaultSetup.reactor.cards.filter(card => card === 'reactorPowerReactor').length + 1;
/** Per-system generation duration at the reactor power level used in tests. */
const slotDuration = generationDurationByReactorPower[defaultReactorPower];

describe('EngineerState generation priority', () => {
    let ship: PlayerShip;
    let gameState: GameState;
    let clock: ClockTimer;

    beforeEach(() => {
        const ctx = createTestShip(0);
        ship = ctx.ship;
        gameState = ctx.gameState;
        clock = ctx.clock;
    });

    describe('normal generation (no priority)', () => {
        it('should generate for each system in sequence order', () => {
            const generated = spyOnGeneration(ship);

            // First call at t=0 starts hull generation (no trigger yet).
            ship.tick(0, 0);
            expect(generated).toEqual([]);

            advanceTime(gameState, clock, ship, slotDuration);
            expect(generated).toEqual(['hull']);

            advanceTime(gameState, clock, ship, slotDuration);
            expect(generated).toEqual(['hull', 'helm']);

            // Complete the rest of the cycle.
            advanceTime(gameState, clock, ship, slotDuration);
            expect(generated).toEqual(['hull', 'helm', 'tactical']);

            advanceTime(gameState, clock, ship, slotDuration);
            expect(generated).toEqual(['hull', 'helm', 'tactical', 'engineer']);

            advanceTime(gameState, clock, ship, slotDuration);
            expect(generated).toEqual(['hull', 'helm', 'tactical', 'engineer', 'science']);

            advanceTime(gameState, clock, ship, slotDuration);
            expect(generated).toEqual(['hull', 'helm', 'tactical', 'engineer', 'science', 'reactor']);
        });
    });
});
