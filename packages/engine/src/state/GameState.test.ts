import { ClockTimer } from '@colyseus/timer';
import { AiShip } from 'src/state/AiShip';
import { GameState } from 'src/state/GameState';
import { shipSetup } from 'src/testUtils';
import { IdProvider } from 'src/types/IdProvider';
import { describe, it, expect } from 'vitest';

function createGameState() {
    let nextId = 1;
    const idPool: IdProvider = { getId: () => String(nextId++), releaseId: () => {} };
    const state = new GameState(idPool, new ClockTimer(false));
    state.initFactions([{ id: 'raiders' }], 'raiders');
    return state;
}

function aiShip(state: GameState, id?: string) {
    return new AiShip(state, { ...shipSetup('raiders'), id, goal: { type: 'search-and-destroy' }, skill: 1 });
}

describe('GameState scenarioId lookup', () => {
    it('resolves an object by its scenario-authored scenarioId', () => {
        const state = createGameState();
        const ship = aiShip(state, 'boss');
        state.add(ship);

        expect(state.getObjectByScenarioId('boss')).toBe(ship);
    });

    it('returns undefined for an unknown scenarioId, and for objects without one', () => {
        const state = createGameState();
        const ship = aiShip(state);
        state.add(ship);

        expect(state.getObjectByScenarioId('boss')).toBeUndefined();
    });

    it('stops resolving a scenarioId once its owning object is removed', () => {
        const state = createGameState();
        const ship = aiShip(state, 'boss');
        state.add(ship);
        state.remove(ship);

        expect(state.getObjectByScenarioId('boss')).toBeUndefined();
    });

    it('keeps resolving to the newer object when a scenarioId is reused, even if the older one is removed first', () => {
        const state = createGameState();
        const first = aiShip(state, 'boss');
        state.add(first);
        const second = aiShip(state, 'boss');
        state.add(second);

        // Removing the stale first owner must not clobber the index entry now owned by `second`.
        state.remove(first);

        expect(state.getObjectByScenarioId('boss')).toBe(second);
    });
});
