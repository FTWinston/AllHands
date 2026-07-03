import { ClockTimer } from '@colyseus/timer';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { IRandom } from 'common-data/types/IRandom';
import { AiShip } from 'src/state/AiShip';
import { GameState } from 'src/state/GameState';
import { shipSetup } from 'src/testUtils';
import { IdProvider } from 'src/types/IdProvider';
import { describe, it, expect, vi } from 'vitest';
import { createBlackboard, resolveAiConfig } from '../types';
import { ScienceOfficer } from './ScienceOfficer';

function fixedRandom(): IRandom {
    return {
        getFloat: () => 0, getBoolean: () => false, getInt: () => 0,
        pick: values => values[0],
        insert: (array, value) => {
            (array as unknown as unknown[]).push(value);
        },
        delete: values => (values as unknown as unknown[]).pop() as never,
        shuffle: () => {},
    };
}

function createWorld() {
    let nextId = 1;
    const idPool: IdProvider = { getId: () => String(nextId++), releaseId: () => {} };
    const state = new GameState(idPool, new ClockTimer(false), 1, fixedRandom());
    state.initFactions([
        { id: 'player' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ], 'player');
    const setup = { ...shipSetup('raiders'), goal: { type: 'search-and-destroy' as const }, skill: 1 };
    setup.science = { ...setup.science, cards: ['scan', 'scan', 'scan'] as never, initialHandSize: 3 };
    const ship = new AiShip(state, setup);
    state.add(ship);
    const enemy = new AiShip(state, { ...shipSetup('player', 5, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
    state.add(enemy);
    ship.updateKnownObjects(0);

    const officer = new ScienceOfficer(ship, state, resolveAiConfig(setup as never));
    const bb = createBlackboard(setup.goal);
    bb.targetId = enemy.id;
    return { ship, enemy, officer, bb };
}

describe('ScienceOfficer', () => {
    it('scans an unidentified slot of the blackboard target', () => {
        const { ship, enemy, officer, bb } = createWorld();
        const playSpy = vi.spyOn(ship.scienceState, 'playCard');
        officer.think(bb, 0);
        expect(playSpy).toHaveBeenCalledWith(expect.any(Number), 'scan', 'enemy', `${enemy.id}:0`);
    });

    it('moves on to the next unidentified slot after a scan lands', () => {
        const { ship, enemy, officer, bb } = createWorld();
        officer.think(bb, 0); // identifies slot 0
        const playSpy = vi.spyOn(ship.scienceState, 'playCard');
        officer.think(bb, 1000);
        expect(playSpy).toHaveBeenCalledWith(expect.any(Number), 'scan', 'enemy', `${enemy.id}:1`);
    });

    it('does not waste scans without a target', () => {
        const { ship, officer, bb } = createWorld();
        bb.targetId = null;
        const playSpy = vi.spyOn(ship.scienceState, 'playCard');
        officer.think(bb, 0);
        expect(playSpy).not.toHaveBeenCalled(); // deflector loads score 4 < threshold
    });
});
