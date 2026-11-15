import { CardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { CardTrait } from 'common-data/features/cards/types/CardTrait';
import { CardType, cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';

/** What a weapon-target card says about which weapons it can be played on. */
type WeaponTargetRules = {
    targetType: 'weapon';
    requiredWeaponTrait?: CardTrait;
    instant?: boolean;
};

/** The parts of a weapon slot that say whether a card can be played on it. */
type SlotState = {
    card: { type: CardType } | null;
    modified: boolean;
};

/**
 * Whether a weapon-target card can be played on a weapon slot: it needs a weapon loaded, with the trait the card requires,
 * that doesn't yet have a modifier, unless the card is instant. Mirrors the server's `TacticalState.playWeaponCard`.
 */
export function canPlayOnWeapon(rules: WeaponTargetRules, slot: SlotState): boolean {
    if (!slot.card || (slot.modified && !rules.instant)) {
        return false;
    }

    const { requiredWeaponTrait } = rules;
    if (requiredWeaponTrait === undefined) {
        return true;
    }

    return (cardDefinitions[slot.card.type] as CardDefinition).traits?.includes(requiredWeaponTrait) ?? false;
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
