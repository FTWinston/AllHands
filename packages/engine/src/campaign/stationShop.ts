import { getCardRarity, shopRarityWeights } from 'common-data/features/cards/utils/getCardRarity';
import { getShopCardTypes } from 'common-data/features/cards/utils/getShopCardTypes';
import { CardState } from '../state/CardState';
import type { Ship } from '../state/Ship';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import type { IRandom } from 'common-data/types/IRandom';

/** How many cards a shop station offers. */
export const shopCardCount = 5;

/**
 * Picks the different types of card a shop offers the given crew member, at random from those it can sell (see `getShopCardTypes`).
 * Rarer cards are less likely to be picked (see `shopRarityWeights`).
 */
export function pickShopCardTypes(random: IRandom, role: CrewRoleName, count = shopCardCount): CardType[] {
    const pool = getShopCardTypes(role).map(type => ({ type, weight: shopRarityWeights[getCardRarity(type)] }));
    const picked: CardType[] = [];

    while (picked.length < count && pool.length > 0) {
        const totalWeight = pool.reduce((total, entry) => total + entry.weight, 0);
        let roll = random.getFloat(0, totalWeight);

        // Walk the pool until the roll falls within a card's share of the total weight. The last card catches any rounding at the very end.
        let index = 0;
        while (index < pool.length - 1 && roll >= pool[index].weight) {
            roll -= pool[index].weight;
            index++;
        }

        picked.push(pool.splice(index, 1)[0].type);
    }

    return picked;
}

/** New cards for a shop to offer the given crew member of the given ship. */
export function createShopCards(random: IRandom, ship: Ship, role: CrewRoleName): CardState[] {
    return pickShopCardTypes(random, role).map(type => new CardState(ship.getCardId(), type));
}
