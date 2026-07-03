import { ClockTimer } from '@colyseus/timer';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { IRandom } from 'common-data/types/IRandom';
import { AiShip } from 'src/state/AiShip';
import { GameState } from 'src/state/GameState';
import { SubTargetState } from 'src/state/systems/tactical/SubTargetState';
import { TargetSubTargetsState } from 'src/state/systems/tactical/TargetSubTargetsState';
import { shipSetup } from 'src/testUtils';
import { IdProvider } from 'src/types/IdProvider';
import { describe, it, expect, vi } from 'vitest';
import { createBlackboard, resolveAiConfig } from '../types';
import { TacticalOfficer } from './TacticalOfficer';

function fixedRandom(): IRandom {
    return {
        getFloat: () => 0, getBoolean: () => true, getInt: () => 0, // getBoolean true → weapon hits always land
        pick: values => values[0],
        insert: (array, value) => {
            (array as unknown as unknown[]).push(value);
        },
        delete: values => (values as unknown as unknown[]).pop() as never,
        shuffle: () => {},
    };
}

function createWorld(tacticalCards: string[], targetDistance: number) {
    let nextId = 1;
    const idPool: IdProvider = { getId: () => String(nextId++), releaseId: () => {} };
    const state = new GameState(idPool, new ClockTimer(false), 1, fixedRandom());
    state.initFactions([
        { id: 'player' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ], 'player');
    const setup = { ...shipSetup('raiders'), goal: { type: 'search-and-destroy' as const }, skill: 1 };
    setup.tactical = { ...setup.tactical, numSlots: 1, cards: tacticalCards as never, initialHandSize: tacticalCards.length };
    const ship = new AiShip(state, setup);
    state.add(ship);
    // Ship faces +x (angle 0 via shipSetup); target dead ahead.
    const enemy = new AiShip(state, { ...shipSetup('player', targetDistance, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
    state.add(enemy);
    ship.updateKnownObjects(0);

    const officer = new TacticalOfficer(ship, state, resolveAiConfig(setup as never));
    const bb = createBlackboard(setup.goal);
    bb.targetId = enemy.id;
    bb.stance = 'aggressive';
    return { state, ship, enemy, officer, bb };
}

describe('TacticalOfficer', () => {
    it('loads a weapon into an empty slot', () => {
        const { ship, officer, bb } = createWorld(['phaserCannon'], 5);
        officer.think(bb, 0);
        expect(ship.tacticalState.slots[0].card?.type).toBe('phaserCannon');
    });

    it('primes a loaded slot with a modifier card', () => {
        const { ship, officer, bb } = createWorld(['phaserCannon', 'quickCharge'], 5);
        officer.think(bb, 0); // load
        officer.think(bb, 1000); // prime
        expect(ship.tacticalState.slots[0].primed).toBe(true);
    });

    it('holds charging while far outside weapon range', () => {
        const { ship, officer, bb } = createWorld(['phaserCannon', 'quickCharge'], 60); // phaserCannon maxRange 10
        officer.think(bb, 0); // load (45 clears threshold regardless of range)
        officer.think(bb, 1000); // prime scores 40 — priming is fine early
        const playSpy = vi.spyOn(ship.tacticalState, 'playCard');
        officer.think(bb, 2000); // charge would score 8 < threshold 20 → hold
        expect(playSpy).not.toHaveBeenCalled();
    });

    it('fires a charged, primed weapon at a target in range and arc', () => {
        const { ship, officer, bb } = createWorld(['phaserCannon'], 5);
        officer.think(bb, 0); // load
        const slot = ship.tacticalState.slots[0];
        slot.primed = true;
        slot.charge = slot.getParameter('chargeCost'); // stage: fully charged

        officer.think(bb, 1000);

        expect(slot.charge).toBe(0); // afterFiring reset — the shot really happened
    });

    it('aims at a vulnerability sub-target when one is exposed', () => {
        const { ship, enemy, officer, bb } = createWorld(['phaserCannon'], 5);
        officer.think(bb, 0);
        const slot = ship.tacticalState.slots[0];
        slot.primed = true;
        slot.charge = slot.getParameter('chargeCost');

        const entry = new TargetSubTargetsState();
        entry.subTargets.push(new SubTargetState('tactical:v1', 'tactical'));
        ship.tacticalState.subTargetsByTarget.set(enemy.id, entry);

        const playSpy = vi.spyOn(ship.tacticalState, 'playCard');
        officer.think(bb, 1000);
        expect(playSpy).toHaveBeenCalledWith(expect.any(Number), 'phaserCannon', 'enemy', `${enemy.id}:tactical:v1`);
    });
});
