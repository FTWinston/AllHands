import { cardDefinitions, type CardType } from './cardDefinitions';
import type { CardDefinition } from '../types/CardDefinition';
import type { CardRarity } from '../types/CardRarity';

/** A card type's rarity: common unless its definition says otherwise. */
export function getCardRarity(type: CardType): CardRarity {
    return (cardDefinitions[type] as CardDefinition).rarity ?? 'common';
}

/** How likely a shop is to offer a card of each rarity, relative to a common one. */
export const shopRarityWeights: Readonly<Record<CardRarity, number>> = {
    common: 4,
    uncommon: 2,
    rare: 1,
};

/** How likely salvage from an elite fight is to be each rarity, relative to a common card: better odds of uncommon and rare cards than a shop. */
export const eliteSalvageRarityWeights: Readonly<Record<CardRarity, number>> = {
    common: 2,
    uncommon: 2,
    rare: 1,
};

/** How likely an outfitting bundle's standout card is to be each rarity. It's never common. */
export const standoutRarityWeights: Readonly<Record<CardRarity, number>> = {
    common: 0,
    uncommon: 2,
    rare: 1,
};
