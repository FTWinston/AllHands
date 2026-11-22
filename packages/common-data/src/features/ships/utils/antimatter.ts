import { getCardRarity } from '../../cards/utils/getCardRarity';
import type { CardRarity } from 'src/features/cards/types/CardRarity';
import type { CardType } from 'src/features/cards/utils/cardDefinitions';
import type { SectorNodeInfo } from 'src/features/sectors/types/SectorNodeInfo';

/** Antimatter awarded to each player ship on completing an encounter, by the kind of node it was. Repair stations award nothing. */
export const antimatterRewards = {
    combat: 10,
    elite: 30,
    boss: 50,
} as const;

/** How much antimatter completing the encounter at the given node awards each player ship. */
export function getAntimatterReward(node: Pick<SectorNodeInfo, 'kind' | 'elite'>): number {
    switch (node.kind) {
        case 'combat':
            return node.elite ? antimatterRewards.elite : antimatterRewards.combat;
        case 'boss':
            return antimatterRewards.boss;
        default:
            return 0;
    }
}

/**
 * Antimatter received for every card that leaves a crew member's deck: sold at a station, replaced when the deck is full, or scrapped as salvage.
 * Any card the crew gains could be sold for this, so turning one down pays the same.
 */
export const cardSellPrice = 10;

/** Selling a card isn't allowed if it would leave a crew member's deck with fewer cards than this. */
export const minDeckSize = 6;

/** The most cards a crew system's deck can hold, unless its ship design says otherwise (see `SystemSetupInfo.maxDeckSize`). */
export const defaultMaxDeckSize = 12;

/** Whether a card can be sold from a deck of the given size without taking it below `minDeckSize`. */
export function canSellFromDeck(deckSize: number): boolean {
    return deckSize > minDeckSize;
}

/** Antimatter spent to buy a card of each rarity from a shop station. */
export const shopCardPrices: Readonly<Record<CardRarity, number>> = {
    common: 15,
    uncommon: 25,
    rare: 40,
};

/** Antimatter spent to buy a card of the given type from a shop station, which depends on its rarity. */
export function getShopCardPrice(type: CardType): number {
    return shopCardPrices[getCardRarity(type)];
}

/** Antimatter spent on a ship's first work order. Each later order from the same ship costs more (see `getOrderPrice`). */
export const baseOrderPrice = 45;

/** How many times the price of the previous work order from the same ship the next one costs. */
export const orderPriceGrowth = 1.5;

/** Antimatter spent to place a work order, for a ship that has already placed the given number this game. Rounded to a multiple of 5. */
export function getOrderPrice(ordersPlaced: number): number {
    return Math.round(baseOrderPrice * orderPriceGrowth ** ordersPlaced / 5) * 5;
}
