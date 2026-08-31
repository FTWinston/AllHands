import { ClockTimer } from '@colyseus/timer';
import { AiShip } from 'src/state/AiShip';
import { GameState } from 'src/state/GameState';
import { shipSetup } from 'src/testUtils';
import { IdProvider } from 'src/types/IdProvider';
import { describe, it, expect } from 'vitest';
import { EndlessCombatEncounters } from './EndlessCombatEncounters';
import type { AiShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { ScenarioConfig } from 'common-data/types/ScenarioConfig';

function createGameState() {
    let nextId = 1;
    const idPool: IdProvider = { getId: () => String(nextId++), releaseId: () => {} };
    const state = new GameState(idPool, new ClockTimer(false));
    state.initFactions([{ id: 'raiders' }], 'raiders');
    return state;
}

function aiSetup(overrides: Partial<AiShipSetupInfo> = {}): AiShipSetupInfo {
    return { ...shipSetup('raiders'), goal: { type: 'search-and-destroy' }, skill: 1, ...overrides };
}

function scenarioWith(enemies: AiShipSetupInfo[]): ScenarioConfig {
    return {
        name: 'Test scenario',
        rules: 'endlessCombat',
        playerFaction: 'player',
        factions: [{ id: 'player' }, { id: 'raiders' }],
        player: shipSetup(undefined) as unknown as ScenarioConfig['player'],
        encounters: [{ enemies }],
    };
}

function aiShips(state: GameState): AiShip[] {
    return [...state.objects.values()].filter((o): o is AiShip => o instanceof AiShip);
}

/** Finds the escort — the AI ship whose goal is guard-ship — among the ships populated into `state`. */
function findEscort(state: GameState): AiShip {
    return aiShips(state).find(ship => ship.ai.blackboard.goal === 'guard-ship')!;
}

function findBoss(state: GameState): AiShip {
    return aiShips(state).find(ship => ship.scenarioId === 'boss')!;
}

describe('EndlessCombatEncounters scenarioId resolution', () => {
    it('resolves a guard-ship goal that references a scenarioId defined earlier in the same encounter', () => {
        const state = createGameState();
        const scenario = scenarioWith([
            aiSetup({ scenarioId: 'boss' }),
            aiSetup({ goal: { type: 'guard-ship', shipId: 'boss' } }),
        ]);
        new EndlessCombatEncounters(state, scenario).populate();

        const escort = findEscort(state);
        const boss = findBoss(state);

        escort.ai.commander.update(escort.ai.blackboard, 0);
        expect(escort.ai.blackboard.goal).toBe('guard-ship');

        state.remove(boss);
        escort.ai.commander.update(escort.ai.blackboard, 0);
        expect(escort.ai.blackboard.goal).toBe('search-and-destroy');
    });

    it('resolves a guard-ship goal that references a scenarioId defined later in the same encounter (forward reference)', () => {
        const state = createGameState();
        const scenario = scenarioWith([
            aiSetup({ goal: { type: 'guard-ship', shipId: 'boss' } }),
            aiSetup({ scenarioId: 'boss' }),
        ]);
        new EndlessCombatEncounters(state, scenario).populate();

        const escort = findEscort(state);
        const boss = findBoss(state);

        escort.ai.commander.update(escort.ai.blackboard, 0);
        expect(escort.ai.blackboard.goal).toBe('guard-ship');

        state.remove(boss);
        escort.ai.commander.update(escort.ai.blackboard, 0);
        expect(escort.ai.blackboard.goal).toBe('search-and-destroy');
    });

    it('leaves an unresolvable guard-ship reference to fall back to search-and-destroy at runtime', () => {
        const state = createGameState();
        const scenario = scenarioWith([
            aiSetup({ goal: { type: 'guard-ship', shipId: 'no-such-ship' } }),
        ]);
        new EndlessCombatEncounters(state, scenario).populate();

        const [escort] = aiShips(state);
        escort.ai.commander.update(escort.ai.blackboard, 0);
        expect(escort.ai.blackboard.goal).toBe('search-and-destroy');
    });
});
