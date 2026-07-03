import { ClockTimer } from '@colyseus/timer';
import { IRandom } from 'common-data/types/IRandom';
import { AiShip } from 'src/state/AiShip';
import { GameState } from 'src/state/GameState';
import { shipSetup } from 'src/testUtils';
import { IdProvider } from 'src/types/IdProvider';
import { describe, it, expect, vi } from 'vitest';
import { createBlackboard, resolveAiConfig } from '../types';
import { EngineerOfficer } from './EngineerOfficer';

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

function createWorld(engineerCards: string[]) {
    let nextId = 1;
    const idPool: IdProvider = { getId: () => String(nextId++), releaseId: () => {} };
    const state = new GameState(idPool, new ClockTimer(false), 1, fixedRandom());
    state.initFactions([{ id: 'raiders' }], 'raiders');
    const setup = { ...shipSetup('raiders'), goal: { type: 'search-and-destroy' as const }, skill: 1 };
    setup.engineer = { ...setup.engineer, cards: engineerCards as never, initialHandSize: engineerCards.length };
    const ship = new AiShip(state, setup);
    state.add(ship);
    const officer = new EngineerOfficer(ship, state, resolveAiConfig(setup as never));
    const bb = createBlackboard(setup.goal);
    return { state, ship, officer, bb };
}

describe('EngineerOfficer', () => {
    it('holds power cards while there is no demand', () => {
        const { ship, officer, bb } = createWorld(['auxPower']);
        const playSpy = vi.spyOn(ship.engineerState, 'playCard');
        officer.think(bb, 0);
        expect(playSpy).not.toHaveBeenCalled();
    });

    it('plays auxPower onto the requested system when a power request lands', () => {
        const { ship, officer, bb } = createWorld(['auxPower']);
        const tacticalTile = ship.engineerState.systems.find(t => t.system === 'tactical')!;
        bb.powerRequests.set('tactical', { desiredLevel: tacticalTile.power + 2, expires: 10_000 });
        const playSpy = vi.spyOn(ship.engineerState, 'playCard');
        officer.think(bb, 0);
        expect(playSpy).toHaveBeenCalledWith(expect.any(Number), 'auxPower', 'system', 'tactical');
    });

    it('holds distributePower when there is no demand', () => {
        const { ship, officer, bb } = createWorld(['distributePower']);
        const playSpy = vi.spyOn(ship.engineerState, 'playCard');
        officer.think(bb, 0);
        expect(playSpy).not.toHaveBeenCalled();
    });

    it('plays distributePower onto a neighbour of the requested system when a request lands', () => {
        // Systems form a 3x2 grid: hull|reactor / helm|science / tactical|engineer.
        // tactical's neighbours are engineer (2 neighbours) and helm (3 neighbours). At the
        // default power level (3), draining helm (loses 1 per neighbour = 3) would zero it out,
        // so it's excluded by the donor safety floor. Engineer (loses 2, ends at 1) is the only
        // system left that can safely donate to tactical's deficit - a deterministic pick.
        const { ship, officer, bb } = createWorld(['distributePower']);
        const tacticalTile = ship.engineerState.systems.find(t => t.system === 'tactical')!;
        bb.powerRequests.set('tactical', { desiredLevel: tacticalTile.power + 2, expires: 10_000 });
        const playSpy = vi.spyOn(ship.engineerState, 'playCard');
        officer.think(bb, 0);
        expect(playSpy).toHaveBeenCalledWith(expect.any(Number), 'distributePower', 'system', 'engineer');
    });

    it('never drains a system that itself has an active power request', () => {
        // Same tactical deficit as above, but engineer (the only safe donor) now has its own
        // active power request, so it is excluded as a donor too. Engineer's own deficit also
        // transiently makes science a donor candidate (science neighbours engineer), but science
        // has 3 neighbours like helm, so it is excluded by the same safety floor. No valid donor
        // is left and the officer holds the card.
        const { ship, officer, bb } = createWorld(['distributePower']);
        const tacticalTile = ship.engineerState.systems.find(t => t.system === 'tactical')!;
        const engineerTile = ship.engineerState.systems.find(t => t.system === 'engineer')!;
        bb.powerRequests.set('tactical', { desiredLevel: tacticalTile.power + 2, expires: 10_000 });
        bb.powerRequests.set('engineer', { desiredLevel: engineerTile.power + 1, expires: 10_000 });
        const playSpy = vi.spyOn(ship.engineerState, 'playCard');
        officer.think(bb, 0);
        expect(playSpy).not.toHaveBeenCalled();
    });

    it('repairs the most damaged system when capacity allows', () => {
        const { ship, officer, bb } = createWorld([]);
        ship.tacticalState.adjustHealth(-60);
        const before = ship.tacticalState.health;
        officer.think(bb, 0);
        expect(ship.tacticalState.health).toBeGreaterThan(before);
        expect(ship.engineerState.repairCapacity).toBeLessThan(ship.engineerState.maxRepairCapacity);
    });

    it('cycles the worst card into the repair meter under hand pressure', () => {
        // Fill the hand (maxHandSize 5 at full health). sustain has no registered evaluator (best score 0)
        // and is not expendable, so it is the cyclable "worst" card. auxPower is expendable —
        // both the evaluator-side filter and the engine (EngineerState repair-target play) exclude it.
        const { ship, officer, bb } = createWorld(['sustain', 'sustain', 'sustain', 'sustain', 'auxPower']);
        ship.engineerState.repairCapacity = 20; // drained: cycling has somewhere to put value
        const before = ship.engineerState.repairCapacity;
        officer.think(bb, 0);
        expect(ship.engineerState.repairCapacity).toBe(before + 10);
        expect(ship.engineerState.hand.length).toBe(4);
    });
});
