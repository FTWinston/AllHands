import { getShopCardTypes } from './getShopCardTypes';
import type { CardType } from './cardDefinitions';
import type { CrewRoleName } from '../../ships/types/CrewRole';

const crewRoles: readonly CrewRoleName[] = ['helm', 'tactical', 'science', 'engineer'];

/**
 * The card types that can become "known" once a crew member sees one, for each crew member: the non-expendable cards that can be in their deck.
 * These are the same cards a shop can sell, so campaign cards (e.g. Warp Away), placeholders and choice options are left out.
 */
export const knowableCardTypesByRole: Readonly<Record<CrewRoleName, readonly CardType[]>> = Object.fromEntries(
    crewRoles.map(role => [role, getShopCardTypes(role)])
) as Record<CrewRoleName, CardType[]>;

/** Every card type that can become known, across all crew members. See `knowableCardTypesByRole`. */
export const knowableCardTypes: ReadonlySet<CardType> = new Set(crewRoles.flatMap(role => knowableCardTypesByRole[role]));

/** Whether seeing a card of this type should add it to the known cards. False for expendable cards, and anything that isn't a card type at all. */
export function isKnowableCardType(type: string): type is CardType {
    return knowableCardTypes.has(type as CardType);
}
