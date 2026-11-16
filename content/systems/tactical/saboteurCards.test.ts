import { cardDefinitions, type CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getShopCardTypes } from 'common-data/features/cards/utils/getShopCardTypes';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { getCardEvaluator } from 'engine/ai/evaluators';
import { getCardSynergy } from 'engine/cards/cardSynergies';
import { getCardDefinition } from 'engine/cards/getEngineCardDefinition';
import { AiShip } from 'engine/state/AiShip';
import { CardState } from 'engine/state/CardState';
import { setupGameRoom, shipSetup } from 'engine/testUtils';
import { describe, expect, it, vi } from 'vitest';
import type { EngineWeaponSlotCardDefinition } from 'engine/cards/EngineCardDefinition';

const rooms = setupGameRoom();

/** A ship with two weapon slots, and an enemy dead ahead and in range for it to shoot at. */
function createFight() {
    const state = rooms.createState();
    state.initFactions([
        { id: 'player' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ], 'player');

    const setup = { ...shipSetup('raiders'), goal: { type: 'search-and-destroy' as const }, skill: 1 };
    setup.tactical = { ...setup.tactical, numSlots: 2 };
    const ship = new AiShip(state, setup);
    state.add(ship);

    const enemy = new AiShip(state, { ...shipSetup('player', 5, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
    state.add(enemy);
    ship.updateKnownObjects(0);

    const tactical = ship.tacticalState;
    (tactical as { powerLevel: number }).powerLevel = 5;

    /** Adds a card of the given type to the hand and plays it. Says whether it was played. */
    const play = (cardType: CardType, targetId = '') => {
        const card = new CardState(ship.getCardId(), cardType);
        tactical.addCardToHand(card);
        const played = tactical.playCard(card.id, cardType, cardDefinitions[cardType].targetType, targetId) !== null;
        if (!played) {
            tactical.removeCard(card.id);
        }
        return played;
    };

    /** Loads a weapon into a slot, with all the charge it can hold. */
    const load = (cardType: CardType, slotIndex: number) => {
        const slot = tactical.slots[slotIndex];
        play(cardType, slot.id);
        slot.addCharge(slot.getParameter('totalCharge'), state.currentTime);
        return slot;
    };

    /** Fires the weapon in a slot at the enemy, and returns the weapon traits it fired with. */
    const fire = (slotIndex: number) => {
        const slot = tactical.slots[slotIndex];
        const cardType = slot.card!.type;
        const fireSpy = vi.spyOn(getCardDefinition(cardType) as EngineWeaponSlotCardDefinition, 'fire').mockReturnValue(true);
        tactical.playWeapon(slot, cardType as never, enemy.id);
        const traits = fireSpy.mock.calls[0]?.[5];
        fireSpy.mockRestore();
        return traits;
    };

    return { state, ship, enemy, tactical, play, load, fire };
}

describe('Plasma Warhead', () => {
    it('costs 2, and is for torpedoes', () => {
        expect(cardDefinitions.plasmaWarhead).toMatchObject({
            targetType: 'weapon', system: 'tactical', requiredWeaponTrait: 'torpedoWeapon', traits: ['persistent'], parameters: { cost: 2, damageReduction: 10 },
        });
        expect(cardDefinitions.plasmaWarhead).not.toHaveProperty('rarity');
    });

    it('takes 10 damage off a torpedo, which then fires with the persistent trait', () => {
        const { play, load, fire } = createFight();
        const slot = load('photonTorpedo', 0);

        expect(play('plasmaWarhead', slot.id)).toBe(true);
        expect(slot.getParameter('damage')).toBe(40 - 10);
        expect(fire(0)).toEqual(expect.arrayContaining(['torpedoWeapon', 'persistent']));
    });

    it('can\'t be played on an energy weapon', () => {
        const { play, load } = createFight();
        const slot = load('phaserCannon', 0);

        expect(play('plasmaWarhead', slot.id)).toBe(false);
    });
});

describe('Proximity Fuse', () => {
    it('costs 3, and is for torpedoes', () => {
        expect(cardDefinitions.proximityFuse).toMatchObject({
            targetType: 'weapon', system: 'tactical', requiredWeaponTrait: 'torpedoWeapon', traits: ['area'], parameters: { cost: 3, accuracyIncrease: 15 },
        });
        expect(cardDefinitions.proximityFuse).not.toHaveProperty('rarity');
    });

    it('makes a torpedo 15 more accurate, and fire with the area trait', () => {
        const { play, load, fire } = createFight();
        const slot = load('photonTorpedo', 0);
        const accuracy = slot.getParameter('accuracy');

        expect(play('proximityFuse', slot.id)).toBe(true);
        expect(slot.getParameter('accuracy')).toBe(accuracy + 15);
        expect(fire(0)).toEqual(expect.arrayContaining(['torpedoWeapon', 'area']));
    });

    it('can\'t be played on an energy weapon', () => {
        const { play, load } = createFight();
        const slot = load('phaserStrip', 0);

        expect(play('proximityFuse', slot.id)).toBe(false);
    });
});

describe('Phase Shift', () => {
    it('costs 2, and is for energy weapons', () => {
        expect(cardDefinitions.phaseShift).toMatchObject({
            targetType: 'weapon', system: 'tactical', requiredWeaponTrait: 'energyWeapon', traits: ['penetrating'], parameters: { cost: 2, chargeIncrease: 2 },
        });
        expect(cardDefinitions.phaseShift).not.toHaveProperty('rarity');
    });

    it('makes an energy weapon use 2 more charge per shot, and fire with the penetrating trait', () => {
        const { play, load, fire } = createFight();
        const slot = load('phaserCannon', 0);
        const chargePerUse = slot.getParameter('chargePerUse');

        expect(play('phaseShift', slot.id)).toBe(true);
        expect(slot.getParameter('chargePerUse')).toBe(chargePerUse + 2);
        expect(fire(0)).toEqual(expect.arrayContaining(['energyWeapon', 'penetrating']));
    });

    it('can\'t be played on a torpedo', () => {
        const { play, load } = createFight();
        const slot = load('photonTorpedo', 0);

        expect(play('phaseShift', slot.id)).toBe(false);
    });
});

describe('the Saboteur weapon modifiers', () => {
    const types = ['plasmaWarhead', 'proximityFuse', 'phaseShift'] as const;

    it('are sold in tactical\'s shop', () => {
        expect(getShopCardTypes('tactical')).toEqual(expect.arrayContaining([...types]));
    });

    it('want the kind of weapon they modify', () => {
        expect(getCardSynergy('plasmaWarhead')).toEqual({ provides: [], wants: ['torpedoWeapon'] });
        expect(getCardSynergy('proximityFuse')).toEqual({ provides: [], wants: ['torpedoWeapon'] });
        expect(getCardSynergy('phaseShift')).toEqual({ provides: [], wants: ['energyWeapon'] });
    });

    it.each(types)('lets the AI play %s on each weapon that has no modifier yet', (type) => {
        const { state, ship, tactical, load } = createFight();
        load('photonTorpedo', 0);
        const ctx = { ship, gameState: state, blackboard: { targetId: null }, system: tactical, currentTime: state.currentTime } as never;

        const plays = getCardEvaluator(type)!(new CardState(ship.getCardId(), type), ctx);
        expect(plays.map(candidate => candidate.action)).toEqual([expect.objectContaining({ cardType: type, targetType: 'weapon', targetId: tactical.slots[0].id })]);
    });
});
