import { CardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { CardTrait } from 'common-data/features/cards/types/CardTrait';
import { CardType, cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';

/** What a weapon-target card says about which weapons it can be played on. */
type WeaponTargetRules = {
    targetType: 'weapon';
    requiredWeaponTrait?: CardTrait;
    instant?: boolean;
};

/** A weapon card in a slot: its type, and any traits it has gained. */
type SlotCard = {
    type: CardType;
    extraTraits?: Partial<Record<CardTrait, unknown>> | null;
};

/** The parts of a weapon slot that say whether a card can be played on it. */
type SlotState = {
    card: SlotCard | null;
    modified: boolean;
};

/** The parts of a weapon slot that say whether it can be charged. */
type ChargeableSlotState = {
    card: SlotCard | null;
    charge: number;
    hasBeenFullyCharged: boolean;
};

/** Whether a card has a trait, either from its definition or gained since. Mirrors the server's `CardState.hasTrait`. */
export function hasCardTrait(card: SlotCard, trait: CardTrait): boolean {
    return (cardDefinitions[card.type] as CardDefinition).traits?.includes(trait)
        || card.extraTraits?.[trait] !== undefined;
}

/**
 * Whether a weapon-target card can be played on a weapon slot: it needs a weapon loaded, with the trait the card requires,
 * that doesn't yet have a modifier and isn't energised, unless the card is instant. Mirrors the server's `TacticalState.playWeaponCard`.
 */
export function canPlayOnWeapon(rules: WeaponTargetRules, slot: SlotState): boolean {
    if (!slot.card) {
        return false;
    }

    if (!rules.instant && (slot.modified || hasCardTrait(slot.card, 'energised'))) {
        return false;
    }

    const { requiredWeaponTrait } = rules;
    if (requiredWeaponTrait === undefined) {
        return true;
    }

    return (cardDefinitions[slot.card.type] as CardDefinition).traits?.includes(requiredWeaponTrait) ?? false;
}

/** Whether a weapon in a slot that stays active once fired (one with a `drainPerSecond` parameter) has been fired, and is still active on its target. */
export function isWeaponActive(slot: { activeTargetId?: string }): boolean {
    return !!slot.activeTargetId;
}

/**
 * Whether cards can be spent on a weapon slot's charge meter, given its weapon's total charge. It needs a weapon loaded, with room for more charge,
 * that hasn't been fully charged yet, or is rechargeable (any number of times, even while active). Mirrors the server's `WeaponSlotState.canBeCharged`.
 */
export function canChargeWeapon(slot: ChargeableSlotState, totalCharge: number): boolean {
    if (!slot.card || slot.charge >= totalCharge) {
        return false;
    }

    return !slot.hasBeenFullyCharged || hasCardTrait(slot.card, 'rechargeable');
}

/**
 * How much charge a card adds to a weapon when it's spent on the weapon's charge meter: its `chargeValue` parameter if it has one, otherwise its cost.
 * Mirrors the server's `TacticalState.chargeWeaponSlot`.
 */
export function getChargeValue(card: { type: CardType; modifiers?: Partial<Record<string, number>> | null }): number {
    const { parameters } = cardDefinitions[card.type] as CardDefinition;
    const resolve = (name: string) => (parameters[name] ?? 0) + (card.modifiers?.[name] ?? 0);
    return resolve('chargeValue') || resolve('cost');
}
