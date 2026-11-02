import { getShopCardTypes } from 'common-data/features/cards/utils/getShopCardTypes';
import { CardState } from '../state/CardState';
import type { Ship } from '../state/Ship';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import type { IRandom } from 'common-data/types/IRandom';

/** How many cards a shop station offers. */
export const shopCardCount = 5;

/** Picks the different types of card a shop offers the given crew member, at random from those it can sell (see `getShopCardTypes`). */
export function pickShopCardTypes(random: IRandom, role: CrewRoleName, count = shopCardCount): CardType[] {
    const pool = getShopCardTypes(role);
    const picked: CardType[] = [];

    while (picked.length < count && pool.length > 0) {
        picked.push(random.delete(pool));
    }

    return picked;
}

/** New cards for a shop to offer the given crew member of the given ship. */
export function createShopCards(random: IRandom, ship: Ship, role: CrewRoleName): CardState[] {
    return pickShopCardTypes(random, role).map(type => new CardState(ship.getCardId(), type));
}
