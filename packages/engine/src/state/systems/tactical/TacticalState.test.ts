import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { FiringState } from 'common-data/features/space/types/FiringState';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { getFiringState } from 'common-data/features/space/utils/getFiringState';
import { AiShip } from 'src/state/AiShip';
import { CardState } from 'src/state/CardState';
import { MotionKeyframe } from 'src/state/MotionKeyframe';
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
        const { tactical } = createTactical(['phaserCannon', 'acquireLock']);
        const slot = loadWeapon(tactical);

        expect(tactical.chargeWeaponSlot(handCard(tactical, 'acquireLock').id, slot.id)).toBe(false);
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

    it('lets a rechargeable weapon go on being charged after it has been full, any number of times, keeping the trait', () => {
        const { tactical } = createTactical(['phaserCannon', 'lowYield', 'highYield', 'weaponOvercharge']);
        const slot = loadWeapon(tactical);
        slot.card!.addTrait('rechargeable', ExtraTraitType.Normal);
        const totalCharge = slot.getParameter('totalCharge');
        slot.addCharge(totalCharge, 0);
        slot.charge = totalCharge - 5;

        expect(tactical.chargeWeaponSlot(handCard(tactical, 'lowYield').id, slot.id)).toBe(true);
        expect(slot.charge).toBe(totalCharge - 4);
        expect(slot.card!.hasTrait('rechargeable')).toBe(true);

        expect(tactical.chargeWeaponSlot(handCard(tactical, 'highYield').id, slot.id)).toBe(true);
        expect(slot.charge).toBe(totalCharge - 1);

        // Full again, so there's no room for more until it loses some.
        expect(tactical.chargeWeaponSlot(handCard(tactical, 'weaponOvercharge').id, slot.id)).toBe(true);
        expect(slot.charge).toBe(totalCharge);
        expect(slot.canBeCharged()).toBe(false);
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

describe('TacticalState sending weapon slots to clients', () => {
    /** Load a weapon into the first slot, eject it, and draw it back into the hand. */
    async function weaponBackInHandAfterSlot1() {
        const { tactical } = createTactical(['phaserCannon', 'photonTorpedo']);
        const room = await rooms.connectClient();
        const weapon = loadWeapon(tactical).card!;
        room.broadcastPatch();
        tactical.ejectWeapon('slot1');
        room.broadcastPatch();
        tactical.drawFromBottom();
        expect(tactical.hand).toContain(weapon);
        room.broadcastPatch();
        return { tactical, room };
    }

    it('can send state after a weapon that was in one slot is loaded into another', async () => {
        const { tactical, room } = await weaponBackInHandAfterSlot1();

        loadWeapon(tactical, 'phaserCannon', 1);

        expect(tactical.slots[1].card?.type).toBe('phaserCannon');
        expect(() => room.broadcastPatch()).not.toThrow();
    });

    it('can send state when an encounter ends with a once-slotted weapon back in the hand', async () => {
        const { tactical, room } = await weaponBackInHandAfterSlot1();

        tactical.cleanupAfterEncounter();

        expect(() => room.broadcastPatch()).not.toThrow();
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

        // Out: the weapon was the last card damaged, and that took it out of its slot.
        tactical.adjustHealth(-tactical.health);
        expect(tactical.health).toBe(0);
        expect(slot.card).toBeNull();
        expect(tactical.playWeapon(slot, 'phaserCannon', enemy.id)).toBeNull();
        expect(damage).toHaveBeenCalledTimes(1);
    });

    it('takes a weapon that\'s damaged out of its slot, losing its charge and modifier, as if it were ejected', () => {
        const { tactical } = createTactical(['photonTorpedo', 'lowYield']);
        const slot = loadWeapon(tactical, 'photonTorpedo');
        const weapon = slot.card!;
        tactical.playCard(handCard(tactical, 'lowYield').id, 'lowYield', 'weapon', slot.id);
        slot.addCharge(slot.getParameter('totalCharge'), 0);
        expect(slot.modifierCard).toBe('lowYield');

        tactical.adjustHealth(-tactical.health);

        expect(weapon.isDamaged).toBe(true);
        expect(slot.card).toBeNull();
        expect(slot.charge).toBe(0);
        expect(slot.modifierCard).toBeNull();
        expect(slot.modifiers.size).toBe(0);
        expect(tactical.deck).toContain(weapon);

        // Repaired, it's in the deck, to be drawn and loaded again.
        tactical.adjustHealth(tactical.maxHealth);
        expect(weapon.isDamaged).toBe(false);
        expect(slot.card).toBeNull();
    });

    it('still won\'t fire a weapon left in its slot once tactical is out, as one that\'s expendable is never damaged', () => {
        const { state, ship, tactical } = createTactical(['phaserStrip']);
        const enemy = new AiShip(state, { ...shipSetup('player', 5, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(enemy);
        ship.updateKnownObjects(0);
        tactical.addCardToHand(CardState.createExpendable('phaserCannon', 900));
        const slot = loadWeapon(tactical);
        slot.addCharge(slot.getParameter('totalCharge'), 0);
        const damage = vi.spyOn(enemy, 'damage').mockReturnValue(0);

        tactical.adjustHealth(-tactical.health);
        expect(slot.card?.type).toBe('phaserCannon');
        expect(tactical.playWeapon(slot, 'phaserCannon', enemy.id)).toBeNull();

        tactical.adjustHealth(1);
        expect(tactical.playWeapon(slot, 'phaserCannon', enemy.id)).not.toBeNull();
        expect(damage).toHaveBeenCalledTimes(1);
    });
});

describe('TacticalState energised weapons', () => {
    it('loads an energised weapon fully charged, decaying as any fully charged weapon does', () => {
        const { tactical } = createTactical(['phaserCannon']);
        handCard(tactical, 'phaserCannon').addTrait('energised', ExtraTraitType.Normal);

        const slot = loadWeapon(tactical);

        expect(slot.charge).toBe(slot.getParameter('totalCharge'));
        expect(slot.hasBeenFullyCharged).toBe(true);
        expect(slot.decay).not.toBeNull();
        expect(slot.canBeCharged()).toBe(false);
    });

    it('won\'t take a modifier, but still takes an instant card', () => {
        const { tactical } = createTactical(['phaserCannon', 'precisionFocus', 'powerCell']);
        handCard(tactical, 'phaserCannon').addTrait('energised', ExtraTraitType.Normal);
        const slot = loadWeapon(tactical);
        expect(slot.canBeModified()).toBe(false);

        expect(tactical.playCard(handCard(tactical, 'precisionFocus').id, 'precisionFocus', 'weapon', slot.id)).toBeNull();
        expect(slot.modified).toBe(false);

        // Power Cell is instant, so it's only refused here for having no room to charge.
        expect(tactical.playCard(handCard(tactical, 'powerCell').id, 'powerCell', 'weapon', slot.id)).toBeNull();
        slot.charge -= 2;
        slot.card!.addTrait('rechargeable', ExtraTraitType.Normal);
        expect(tactical.playCard(handCard(tactical, 'powerCell').id, 'powerCell', 'weapon', slot.id)).not.toBeNull();
        expect(slot.modified).toBe(false);
    });
});

describe('TacticalState weapons that drain once fired', () => {
    /** A charged phaser cannon given a drain, and an enemy dead ahead and in range to fire it at. */
    function createDrainingWeapon(drainPerSecond = 2) {
        const fight = createTactical(['phaserCannon', 'phaserStrip', 'lowYield', 'highYield']);
        const { state, ship, tactical } = fight;
        const enemy = new AiShip(state, { ...shipSetup('player', 5, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(enemy);
        ship.updateKnownObjects(0);

        const slot = loadWeapon(tactical);
        slot.adjustParameter('drainPerSecond', drainPerSecond);
        slot.addCharge(slot.getParameter('totalCharge'), 0);
        vi.spyOn(enemy, 'damage').mockReturnValue(0);

        const wait = (duration: number) => {
            state.currentTime += duration;
            tactical.update(state.currentTime);
        };

        return { ...fight, enemy, slot, wait };
    }

    it('stays active on its target once fired, spending no use\'s charge, and can\'t be fired again while active', () => {
        const { tactical, enemy, slot } = createDrainingWeapon();
        const totalCharge = slot.getParameter('totalCharge');

        expect(tactical.playWeapon(slot, 'phaserCannon', enemy.id)).not.toBeNull();

        expect(slot.isActive).toBe(true);
        expect(slot.activeTargetId).toBe(enemy.id);
        expect(slot.charge).toBe(totalCharge);
        expect(tactical.playWeapon(slot, 'phaserCannon', enemy.id)).toBeNull();
    });

    it('drains its drainPerSecond in charge each second, and is used up at 0', () => {
        const { tactical, enemy, slot, wait } = createDrainingWeapon(2);
        const weapon = slot.card!;
        const totalCharge = slot.getParameter('totalCharge');
        tactical.playWeapon(slot, 'phaserCannon', enemy.id);

        wait(1000);
        expect(slot.charge).toBe(totalCharge - 2);

        wait((totalCharge - 2) / 2 * 1000 - 1);
        expect(slot.card).toBe(weapon);

        wait(1);
        expect(slot.card).toBeNull();
        expect(slot.isActive).toBe(false);
        expect(tactical.deck.at(-1)).toBe(weapon);
    });

    it('can be charged again and again while active, if it\'s rechargeable, and not otherwise', () => {
        const { tactical, enemy, slot, wait } = createDrainingWeapon(2);
        tactical.playWeapon(slot, 'phaserCannon', enemy.id);
        wait(2000);
        expect(slot.canBeCharged()).toBe(false);

        slot.card!.addTrait('rechargeable', ExtraTraitType.Normal);
        expect(tactical.chargeWeaponSlot(handCard(tactical, 'lowYield').id, slot.id)).toBe(true);
        expect(tactical.chargeWeaponSlot(handCard(tactical, 'highYield').id, slot.id)).toBe(true);
        expect(slot.isActive).toBe(true);
        expect(slot.charge).toBe(slot.getParameter('totalCharge'));
    });

    it('ends once its target is out of range or gone, or when ejected, discarding the weapon', () => {
        const { tactical, enemy, slot, wait } = createDrainingWeapon();
        tactical.playWeapon(slot, 'phaserCannon', enemy.id);
        enemy.destroy();
        wait(1);
        expect(slot.card).toBeNull();

        const other = createDrainingWeapon();
        other.tactical.playWeapon(other.slot, 'phaserCannon', other.enemy.id);
        other.enemy.setMotion(new MotionKeyframe(other.state.currentTime, other.slot.getParameter('maxRange') + 1, 0, 0));
        other.wait(1);
        expect(other.slot.card).toBeNull();

        const ejected = createDrainingWeapon();
        ejected.tactical.playWeapon(ejected.slot, 'phaserCannon', ejected.enemy.id);
        expect(ejected.tactical.ejectWeapon(ejected.slot.id)).toBe(true);
        expect(ejected.slot.isActive).toBe(false);
    });

    it('stays active outside its firing arc, as long as its target is in range', () => {
        const { state, tactical, enemy, slot, wait } = createDrainingWeapon();
        tactical.playWeapon(slot, 'phaserCannon', enemy.id);
        enemy.setMotion(new MotionKeyframe(state.currentTime, -5, 0, 0));
        wait(1);
        expect(slot.isActive).toBe(true);
    });

    it('isn\'t part of a volley', () => {
        const { tactical, enemy, slot } = createDrainingWeapon();
        tactical.addLock(enemy, 1);

        expect(tactical.fireVolley(5)).toBe(0);
        expect(slot.isActive).toBe(false);
        expect(slot.card).not.toBeNull();
    });
});
