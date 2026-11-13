import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { IRandom } from 'common-data/types/IRandom';
import { AiShip } from 'src/state/AiShip';
import { MotionKeyframe } from 'src/state/MotionKeyframe';
import { SubTargetState } from 'src/state/systems/tactical/SubTargetState';
import { TargetSubTargetsState } from 'src/state/systems/tactical/TargetSubTargetsState';
import { shipSetup, setupGameRoom } from 'src/testUtils';
import { describe, it, expect, vi } from 'vitest';
import { createBlackboard, resolveAiConfig } from '../types';
import { TacticalOfficer, UNLOAD_WAIT_MAX_MS, UNLOAD_WAIT_MIN_MS } from './TacticalOfficer';

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

function createWorld(tacticalCards: string[], targetDistance: number, numSlots = 1) {
    const state = rooms.createState(fixedRandom());
    state.initFactions([
        { id: 'player' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ], 'player');
    const setup = { ...shipSetup('raiders'), goal: { type: 'search-and-destroy' as const }, skill: 1 };
    setup.tactical = { ...setup.tactical, numSlots, cards: tacticalCards as never, initialHandSize: tacticalCards.length };
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

    describe('a weapon it can\'t use', () => {
        /** Loads and fully charges each of these weapons, one to a slot, with the target at the given distance, dead ahead. */
        function createStuck(slotted: string[], hand: string[], targetDistance: number) {
            const world = createWorld([...slotted, ...hand], targetDistance, slotted.length);
            const tactical = world.ship.tacticalState;
            slotted.forEach((type, index) => {
                const card = tactical.hand.find(candidate => candidate.type === type)!;
                (tactical as { powerLevel: number }).powerLevel = 5;
                tactical.playCard(card.id, type as never, 'weapon-slot', tactical.slots[index].id);
                tactical.slots[index].addCharge(tactical.slots[index].getParameter('totalCharge'), 0);
            });
            // The wait before unloading: 10 seconds.
            const wait = vi.spyOn(world.state.random, 'getFloat').mockReturnValue(10_000);
            return { ...world, tactical, wait };
        }

        it('unloads a charged weapon that can\'t reach the target, after a wait, when one in hand could', () => {
            const { officer, bb, tactical, wait } = createStuck(['phaserCannon'], ['photonTorpedo'], 15);
            const slot = tactical.slots[0];
            const cannon = slot.card!;

            officer.think(bb, 1000); // The wait starts.
            expect(wait).toHaveBeenCalledWith(UNLOAD_WAIT_MIN_MS, UNLOAD_WAIT_MAX_MS);
            officer.think(bb, 10_900);
            expect(slot.card).toBe(cannon);

            officer.think(bb, 11_000);
            expect(slot.card).toBeNull();
            expect(tactical.deck).toContain(cannon);

            officer.think(bb, 12_000);
            expect(slot.card?.type).toBe('photonTorpedo');
        });

        it('doesn\'t unload it when the weapon in hand couldn\'t reach either', () => {
            const { officer, bb, tactical } = createStuck(['phaserCannon'], ['phaserCannon'], 15);
            const cannon = tactical.slots[0].card;

            for (let time = 1000; time <= 60_000; time += 1000) {
                officer.think(bb, time);
            }

            expect(tactical.slots[0].card).toBe(cannon);
        });

        it('doesn\'t unload a weapon that\'s still charging, however far off the target is', () => {
            const { ship, officer, bb } = createWorld(['phaserCannon', 'photonTorpedo'], 15);
            const tactical = ship.tacticalState;
            const cannon = tactical.hand.find(card => card.type === 'phaserCannon')!;
            tactical.playCard(cannon.id, 'phaserCannon', 'weapon-slot', tactical.slots[0].id);
            // Kept from charging it, as that isn't what's being tested.
            vi.spyOn(tactical, 'chargeWeaponSlot').mockReturnValue(false);

            for (let time = 1000; time <= 60_000; time += 1000) {
                officer.think(bb, time);
            }

            expect(tactical.slots[0].card).toBe(cannon);
        });

        it('starts the wait over when the target comes into reach', () => {
            const { enemy, officer, bb, tactical } = createStuck(['phaserCannon'], ['photonTorpedo'], 15);
            const slot = tactical.slots[0];
            const moveTo = (x: number) => {
                enemy.motion.clear();
                enemy.motion.push(new MotionKeyframe(0, x, 0, Math.PI));
            };

            officer.think(bb, 1000); // The wait starts, to end at 11 seconds.
            moveTo(5);
            // It fires, without using up its charge, or harming the target.
            vi.spyOn(slot, 'afterFiring').mockReturnValue(false);
            const fired = vi.spyOn(enemy, 'damage').mockReturnValue(0);
            officer.think(bb, 5000);
            expect(fired).toHaveBeenCalled();
            moveTo(15);

            officer.think(bb, 6000); // It starts again, to end at 16 seconds.
            officer.think(bb, 11_000);
            expect(slot.card?.type).toBe('phaserCannon');

            officer.think(bb, 16_000);
            expect(slot.card).toBeNull();
        });

        it('empties the slot whose weapon is furthest from being able to fire', () => {
            const { officer, bb, tactical } = createStuck(['phaserStrip', 'phaserCannon'], ['photonTorpedo'], 15);

            officer.think(bb, 1000);
            officer.think(bb, 11_000);

            // The strip (range 6) is further off than the cannon (range 10).
            expect(tactical.slots[0].card).toBeNull();
            expect(tactical.slots[1].card?.type).toBe('phaserCannon');
        });
    });

    it('loads a weapon that reaches the target before one that doesn\'t', () => {
        const { ship, officer, bb } = createWorld(['phaserCannon', 'photonTorpedo'], 15);

        officer.think(bb, 0);

        expect(ship.tacticalState.slots[0].card?.type).toBe('photonTorpedo');
    });
});
