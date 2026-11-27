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
