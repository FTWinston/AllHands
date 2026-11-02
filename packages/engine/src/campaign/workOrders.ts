import { getSynergyCardTypes } from '../cards/cardSynergies';
import { CardState } from '../state/CardState';
import type { Ship } from '../state/Ship';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { IRandom } from 'common-data/types/IRandom';

/** How many cards a work order delivers, for the crew member to choose one of. */
export const deliveryCardCount = 3;

/** Whether a work order can be placed for the given spec card: only if it has something to deliver. */
export function canOrderFor(spec: CardType): boolean {
    return getSynergyCardTypes(spec).length > 0;
}

/**
 * Picks the different types of card a work order for the given spec delivers, at random from its matches (see `getSynergyCardTypes`).
 * Types the crew member doesn't own come first, and owned ones only fill in when there aren't enough of those.
 */
export function pickDeliveryCardTypes(random: IRandom, spec: CardType, owned: ReadonlySet<CardType>, count = deliveryCardCount): CardType[] {
    const matches = getSynergyCardTypes(spec);
    const unowned = matches.filter(type => !owned.has(type));
    const ownedMatches = matches.filter(type => owned.has(type));
    const picked: CardType[] = [];

    for (const pool of [unowned, ownedMatches]) {
        while (picked.length < count && pool.length > 0) {
            picked.push(random.delete(pool));
        }
    }

    return picked;
}

/** New cards delivered by a work order for the given spec, to a crew member who owns the given card types. See `pickDeliveryCardTypes`. */
export function createDeliveryCards(random: IRandom, ship: Ship, spec: CardType, owned: Iterable<CardType>): CardState[] {
    return pickDeliveryCardTypes(random, spec, new Set(owned)).map(type => new CardState(ship.getCardId(), type));
}
