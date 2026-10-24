import type { SectorNodeInfo } from 'src/features/sectors/types/SectorNodeInfo';

/** Antimatter awarded to each player ship on completing an encounter, by the kind of node it was. Repair stations award nothing. */
export const antimatterRewards = {
    combat: 10,
    elite: 30,
    boss: 30,
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

/** Antimatter received for selling a card from a crew member's deck at a station. */
export const cardSellPrice = 10;

/** Selling a card isn't allowed if it would leave a crew member's deck with fewer cards than this. */
export const minDeckSize = 10;

/** Whether a card can be sold from a deck of the given size without taking it below `minDeckSize`. */
export function canSellFromDeck(deckSize: number): boolean {
    return deckSize > minDeckSize;
}

/** Antimatter spent to buy a card from a shop station. */
export const shopCardPrice = 20;
