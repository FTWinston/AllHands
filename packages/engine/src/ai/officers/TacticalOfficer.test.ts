import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { IRandom } from 'common-data/types/IRandom';
import { AiShip } from 'src/state/AiShip';
import { SubTargetState } from 'src/state/systems/tactical/SubTargetState';
import { TargetSubTargetsState } from 'src/state/systems/tactical/TargetSubTargetsState';
import { shipSetup, setupGameRoom } from 'src/testUtils';
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

const rooms = setupGameRoom();

function createWorld(tacticalCards: string[], targetDistance: number) {
    const state = rooms.createState(fixedRandom());
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

    it('modifies a loaded slot with a modifier card', () => {
        const { ship, officer, bb } = createWorld(['photonTorpedo', 'lowYield'], 60); // out of range, so charging scores too low to compete
        officer.think(bb, 0); // load
        const slot = ship.tacticalState.slots[0];
        officer.think(bb, 1000); // modify
        expect(slot.modified).toBe(true);
    });

    it('spends a weapon card to charge a loaded weapon in range', () => {
        const { ship, officer, bb } = createWorld(['photonTorpedo', 'lowYield'], 5);
        officer.think(bb, 0); // load
        officer.think(bb, 1000); // charge scores 55, beating modifying at 42
        const slot = ship.tacticalState.slots[0];
        expect(slot.charge).toBe(1);
        expect(slot.modified).toBe(false);
    });

    it('holds charging while far outside weapon range', () => {
        const { ship, officer, bb } = createWorld(['photonTorpedo', 'lowYield'], 60); // phaserCannon maxRange 10
        officer.think(bb, 0); // load (45 clears threshold regardless of range)
        officer.think(bb, 1000); // modifying scores 42 — fine early
        const chargeSpy = vi.spyOn(ship.tacticalState, 'chargeWeaponSlot');
        officer.think(bb, 2000); // charge would score 8 < threshold 20 → hold
        expect(chargeSpy).not.toHaveBeenCalled();
    });

    it('fires a fully charged weapon at a target in range and arc, without modifying it', () => {
        const { ship, officer, bb } = createWorld(['phaserCannon'], 5);
        officer.think(bb, 0); // load
        const slot = ship.tacticalState.slots[0];
        slot.addCharge(slot.getParameter('totalCharge'), 0); // stage: fully charged

        officer.think(bb, 1000);

        expect(slot.charge).toBe(slot.getParameter('totalCharge') - slot.getParameter('chargePerUse')); // the shot really happened
    });

    it('aims at a vulnerability sub-target when one is exposed', () => {
        const { ship, enemy, officer, bb } = createWorld(['phaserCannon'], 5);
        officer.think(bb, 0);
        const slot = ship.tacticalState.slots[0];
        slot.addCharge(slot.getParameter('totalCharge'), 0);

        const entry = new TargetSubTargetsState();
        entry.subTargets.push(new SubTargetState('tactical:v1', 'tactical'));
        ship.tacticalState.subTargetsByTarget.set(enemy.id, entry);

        const playSpy = vi.spyOn(ship.tacticalState, 'playCard');
        officer.think(bb, 1000);
        expect(playSpy).toHaveBeenCalledWith(expect.any(Number), 'phaserCannon', 'enemy', `${enemy.id}:tactical:v1`);
    });
});
