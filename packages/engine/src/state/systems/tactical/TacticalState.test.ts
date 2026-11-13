import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { FiringState } from 'common-data/features/space/types/FiringState';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { getFiringState } from 'common-data/features/space/utils/getFiringState';
import { AiShip } from 'src/state/AiShip';
import { shipSetup, setupGameRoom } from 'src/testUtils';
import { describe, it, expect, vi } from 'vitest';

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
    return { state, ship, tactical };
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
        expect(slot.modifierCard).toBe('lowYield');
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
        slot.modifierCard = 'lowYield';
        slot.charge = slot.getParameter('chargePerUse');

        expect(slot.afterFiring(0)).toBe(true);
        expect(slot.card).toBeNull();
        expect(slot.modified).toBe(false);
        expect(slot.modifierCard).toBeNull();
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

    it('ejects a weapon to the end of the deck, losing its charge and modifier', () => {
        const { tactical } = createTactical(['phaserCannon', 'precisionFocus']);
        const slot = loadWeapon(tactical);
        const weapon = slot.card!;
        tactical.playCard(handCard(tactical, 'precisionFocus').id, 'precisionFocus', 'weapon', slot.id);
        slot.addCharge(slot.getParameter('totalCharge'), 0);

        expect(tactical.ejectWeapon(slot.id)).toBe(true);

        expect(slot.card).toBeNull();
        expect(slot.charge).toBe(0);
        expect(slot.modified).toBe(false);
        expect(slot.modifierCard).toBeNull();
        expect(slot.modifiers.size).toBe(0);
        expect(slot.hasBeenFullyCharged).toBe(false);
        expect(slot.decay).toBeNull();
        expect(tactical.deck.at(-1)).toBe(weapon);
        expect(tactical.hand.includes(weapon)).toBe(false);
    });

    it('strips traits a modifier added when ejecting a weapon', () => {
        const { tactical } = createTactical(['phaserCannon', 'rechargeable']);
        const slot = loadWeapon(tactical);
        const weapon = slot.card!;
        tactical.playCard(handCard(tactical, 'rechargeable').id, 'rechargeable', 'weapon', slot.id);

        tactical.ejectWeapon(slot.id);

        expect(weapon.hasTrait('rechargeable')).toBe(false);
    });

    it('lets a new weapon be loaded into an ejected slot', () => {
        const { tactical } = createTactical(['phaserCannon', 'photonTorpedo']);
        const slot = loadWeapon(tactical);

        tactical.ejectWeapon(slot.id);
        loadWeapon(tactical, 'photonTorpedo');

        expect(slot.card?.type).toBe('photonTorpedo');
    });

    it.each(['slot1', 'nonexistent'])('refuses to eject from %s when it holds no weapon', (slotId) => {
        const { tactical } = createTactical(['phaserCannon']);
        const deckSize = tactical.deck.length;

        expect(tactical.ejectWeapon(slotId)).toBe(false);
        expect(tactical.deck.length).toBe(deckSize);
    });

    it('clears slot modifiers at the end of an encounter', () => {
        const { tactical } = createTactical(['phaserCannon', 'precisionFocus']);
        const slot = loadWeapon(tactical);
        tactical.playCard(handCard(tactical, 'precisionFocus').id, 'precisionFocus', 'weapon', slot.id);

        tactical.cleanupAfterEncounter();

        expect(slot.card).toBeNull();
        expect(slot.modifiers.size).toBe(0);
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

describe('TacticalState firing', () => {
    it.each([
        ['at a system', 'tactical'],
        ['at nothing in particular', undefined],
    ] as const)('fires every shot of a multi-shot weapon aimed %s', (_, aim) => {
        const { state, ship, tactical } = createTactical(['phaserCannon']);
        // Dead ahead, and in range.
        const enemy = new AiShip(state, { ...shipSetup('player', 5, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(enemy);
        ship.updateKnownObjects(0);
        tactical.setSystemSubTargets(enemy.id, ['tactical', 'helm']);

        const slot = loadWeapon(tactical);
        slot.addCharge(slot.getParameter('totalCharge'), 0);
        slot.adjustParameter('extraShots', 2);

        const damage = vi.spyOn(enemy, 'damage').mockReturnValue(0);
        const setTimeout = vi.spyOn(state, 'setTimeout');

        expect(tactical.playWeapon(slot, 'phaserCannon', aim ? `${enemy.id}:${aim}` : enemy.id)).not.toBeNull();
        for (const [fireExtraShot] of setTimeout.mock.calls) {
            fireExtraShot();
        }

        expect(damage).toHaveBeenCalledTimes(3);
        for (const [hit] of damage.mock.calls) {
            expect(hit.targetSystem).toBe(aim);
            expect(hit.sourceId).toBe(ship.id);
        }
    });

    it('can\'t fire a weapon that\'s loaded and charged once tactical is put out, and can again once it\'s repaired', () => {
        const { state, ship, tactical } = createTactical(['phaserCannon', 'phaserStrip']);
        const enemy = new AiShip(state, { ...shipSetup('player', 5, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(enemy);
        ship.updateKnownObjects(0);

        const slot = loadWeapon(tactical);
        slot.addCharge(slot.getParameter('totalCharge'), 0);
        const damage = vi.spyOn(enemy, 'damage').mockReturnValue(0);

        // Damaged, but not out: the weapon in the slot is the last card to go.
        tactical.adjustHealth(-1);
        expect(tactical.health).toBeGreaterThan(0);
        expect(tactical.playWeapon(slot, 'phaserCannon', enemy.id)).not.toBeNull();
        expect(damage).toHaveBeenCalledTimes(1);

        tactical.adjustHealth(-tactical.health);
        expect(tactical.health).toBe(0);
        expect(tactical.playWeapon(slot, 'phaserCannon', enemy.id)).toBeNull();
        expect(damage).toHaveBeenCalledTimes(1);
        // It's still loaded, and has lost none of its charge.
        expect(slot.card).not.toBeNull();

        tactical.adjustHealth(1);
        expect(tactical.playWeapon(slot, 'phaserCannon', enemy.id)).not.toBeNull();
        expect(damage).toHaveBeenCalledTimes(2);
    });
});
