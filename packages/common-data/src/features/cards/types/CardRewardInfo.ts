import type { CardInstance } from './CardInstance';
import type { CrewRoleName } from 'src/features/ships/types/CrewRole';
import type { IArray } from '@colyseus/react';

/** A card for one crew member's deck, offered to the crew as a whole (see `SalvageCardInfo` and `OutfitBundleInfo`). */
export interface RoleCardInfo {
    role: CrewRoleName;
    card: CardInstance;
}

/**
 * One of the cards salvaged after a fight, for one crew member's deck. The crew member who received the previous salvage chooses which one the ship takes.
 * Shows that deck's size and cap as they were when it was offered, so the chooser can see when taking it would make its crew member replace a card.
 */
export interface SalvageCardInfo extends RoleCardInfo {
    deckSize: number;
    maxDeckSize: number;
}

/** A bundle offered at an outfitting station: a card for each crew member, one of which (the standout) is better than the rest. */
export interface OutfitBundleInfo {
    /** The crew member whose card is the better one. */
    standout: CrewRoleName;
    /** A card for each crew member, in `crewRoleNames` order. */
    cards: IArray<RoleCardInfo>;
}
