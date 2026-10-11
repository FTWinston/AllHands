import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { FiringState } from 'common-data/features/space/types/FiringState';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { getFiringState } from 'common-data/features/space/utils/getFiringState';
import { AiShip } from 'src/state/AiShip';
import { shipSetup, setupGameRoom } from 'src/testUtils';
import { describe, it, expect } from 'vitest';

const rooms = setupGameRoom();

function createTactical(tacticalCards: string[]) {
    const state = rooms.createState();
    state.initFactions([
        { id: 'player' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ], 'player');
    const setup = { ...shipSetup('raiders'), goal: { type: 'search-and-destroy' as const }, skill: 1 };
    setup.tactical = { ...setup.tactical, numSlots: 2, cards: tacticalCards as never, initialHandSize: tacticalCards.length };
    const ship = new AiShip(state, setup);
    state.add(ship);

    const tactical = ship.tacticalState;
    (tactical as { powerLevel: number }).powerLevel = 5;
    return { state, tactical };
}

type Tactical = ReturnType<typeof createTactical>['tactical'];

function loadWeapon(tactical: Tactical, cardType = 'phaserCannon', slotIndex = 0) {
    const weaponCard = tactical.hand.find(card => card.type === cardType)!;
    const slot = tactical.slots[slotIndex];
    tactical.playCard(weaponCard.id, cardType as never, 'weapon-slot', slot.id);
    return slot;
}

function handCard(tactical: Tactical, cardType: string) {
    return tactical.hand.find(card => card.type === cardType)!;
}

describe('TacticalState weapon slot charging', () => {
    it('charges a slot by the cost of a spent weapon card', () => {
        const { tactical } = createTactical(['phaserCannon', 'fullSpread']);
        const slot = loadWeapon(tactical);
        const card = handCard(tactical, 'fullSpread');

        expect(tactical.chargeWeaponSlot(card.id, slot.id)).toBe(true);

        expect(slot.charge).toBe(card.getParameter('cost'));
        expect(tactical.hand.some(c => c.id === card.id)).toBe(false);
        expect(slot.modified).toBe(false);
    });

    it('refuses to spend a card that does not target a weapon or weapon slot', () => {
        const { tactical } = createTactical(['phaserCannon', 'exampleEnemyTarget']);
        const slot = loadWeapon(tactical);

        expect(tactical.chargeWeaponSlot(handCard(tactical, 'exampleEnemyTarget').id, slot.id)).toBe(false);
        expect(slot.charge).toBe(0);
    });

    it('refuses to charge an empty slot', () => {
        const { tactical } = createTactical(['lowYield']);

        expect(tactical.chargeWeaponSlot(tactical.hand[0].id, tactical.slots[0].id)).toBe(false);
    });

    it('refuses a card the system lacks the power to play', () => {
        const { tactical } = createTactical(['phaserCannon', 'weaponOvercharge']);
        const slot = loadWeapon(tactical);
        (tactical as { powerLevel: number }).powerLevel = 1;

        expect(tactical.chargeWeaponSlot(handCard(tactical, 'weaponOvercharge').id, slot.id)).toBe(false);
    });

    it('does not decay or allow firing until the weapon is fully charged', () => {
        const { state, tactical } = createTactical(['phaserCannon', 'lowYield']);
        const slot = loadWeapon(tactical);
        tactical.chargeWeaponSlot(handCard(tactical, 'lowYield').id, slot.id);

        expect(slot.hasBeenFullyCharged).toBe(false);
        expect(slot.decay).toBeNull();

        state.currentTime = 1_000_000;
        tactical.update(state.currentTime);
        expect(slot.charge).toBe(1);

        const solution = { range: 1, relativeBearing: 0, targetAspect: 0 };
        expect(getFiringState(solution, slot.hasBeenFullyCharged, 10, slot.getParameters())).toBe(FiringState.NotCharged);
        expect(getFiringState(solution, true, 10, slot.getParameters())).toBe(FiringState.CanFire);
    });

    it('caps charge at the total, then starts decay', () => {
        const { tactical } = createTactical(['phaserCannon', 'weaponOvercharge']);
        const slot = loadWeapon(tactical);
        slot.charge = slot.getParameter('totalCharge') - 1;

        expect(tactical.chargeWeaponSlot(handCard(tactical, 'weaponOvercharge').id, slot.id)).toBe(true);

        expect(slot.charge).toBe(slot.getParameter('totalCharge'));
        expect(slot.hasBeenFullyCharged).toBe(true);
        expect(slot.decay).not.toBeNull();
    });

    it('refuses further charging of a fully charged weapon without the rechargeable trait', () => {
        const { tactical } = createTactical(['phaserCannon', 'lowYield']);
        const slot = loadWeapon(tactical);
        slot.addCharge(slot.getParameter('totalCharge'), 0);
        slot.charge = 3;

        expect(tactical.chargeWeaponSlot(handCard(tactical, 'lowYield').id, slot.id)).toBe(false);
        expect(slot.charge).toBe(3);
    });

    it('lets a rechargeable weapon be topped up with one card, which removes the trait', () => {
        const { tactical } = createTactical(['phaserCannon', 'lowYield', 'weaponOvercharge']);
        const slot = loadWeapon(tactical);
        slot.card!.addTrait('rechargeable', ExtraTraitType.Normal);
        const totalCharge = slot.getParameter('totalCharge');
        slot.addCharge(totalCharge, 0);
        slot.charge = totalCharge - 5;

        expect(tactical.chargeWeaponSlot(handCard(tactical, 'lowYield').id, slot.id)).toBe(true);
        expect(slot.charge).toBe(totalCharge - 4);
        expect(slot.card!.hasTrait('rechargeable')).toBe(false);

        expect(tactical.chargeWeaponSlot(handCard(tactical, 'weaponOvercharge').id, slot.id)).toBe(false);
        expect(slot.charge).toBe(totalCharge - 4);
    });

    it('lets the rechargeable card add the trait to the weapon', () => {
        const { tactical } = createTactical(['phaserCannon', 'rechargeable']);
        const slot = loadWeapon(tactical);
        const card = handCard(tactical, 'rechargeable');

        expect(tactical.playCard(card.id, 'rechargeable', 'weapon', slot.id)).not.toBeNull();

        expect(slot.modified).toBe(true);
        expect(slot.card!.hasTrait('rechargeable')).toBe(true);
    });

    it('does not let a modifier card charge a slot when played on it', () => {
        const { tactical } = createTactical(['photonTorpedo', 'lowYield']);
        const slot = loadWeapon(tactical, 'photonTorpedo');

        tactical.playCard(handCard(tactical, 'lowYield').id, 'lowYield', 'weapon', slot.id);

        expect(slot.modified).toBe(true);
        expect(slot.charge).toBe(0);
    });

    it('consumes one use of charge when firing and keeps the weapon while charge remains', () => {
        const { tactical } = createTactical(['phaserCannon']);
        const slot = loadWeapon(tactical);
        slot.charge = slot.getParameter('chargePerUse') * 2;

        expect(slot.afterFiring(0)).toBe(false);
        expect(slot.charge).toBe(slot.getParameter('chargePerUse'));
        expect(slot.card).not.toBeNull();
    });

    it('discards the weapon, resetting the slot, when firing uses up its charge', () => {
        const { tactical } = createTactical(['phaserCannon']);
        const slot = loadWeapon(tactical);
        slot.addCharge(slot.getParameter('totalCharge'), 0);
        slot.modified = true;
        slot.charge = slot.getParameter('chargePerUse');

        expect(slot.afterFiring(0)).toBe(true);
        expect(slot.card).toBeNull();
        expect(slot.modified).toBe(false);
        expect(slot.hasBeenFullyCharged).toBe(false);
    });

    it('discards the weapon when its charge decays to nothing', () => {
        const { state, tactical } = createTactical(['phaserCannon']);
        const slot = loadWeapon(tactical);
        slot.addCharge(slot.getParameter('totalCharge'), 0);
        slot.charge = 1;

        state.currentTime = slot.decay!.endTime + 1;
        tactical.update(state.currentTime);

        expect(slot.card).toBeNull();
        expect(slot.charge).toBe(0);
    });

    it('keeps a weapon whose charge is still above zero after decaying', () => {
        const { state, tactical } = createTactical(['phaserCannon']);
        const slot = loadWeapon(tactical);
        slot.addCharge(slot.getParameter('totalCharge'), 0);
        slot.charge = 2;

        state.currentTime = slot.decay!.endTime + 1;
        tactical.update(state.currentTime);

        expect(slot.card).not.toBeNull();
        expect(slot.charge).toBe(1);
    });
});
