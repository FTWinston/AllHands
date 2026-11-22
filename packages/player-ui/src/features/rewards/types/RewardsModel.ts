import type { Snapshot } from '@colyseus/react';
import type { CardInstance } from 'common-data/features/cards/types/CardInstance';
import type { SalvageCardInfo } from 'common-data/features/cards/types/CardRewardInfo';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';

/** What one outfitting bundle offers a crew member: their own card from it, and who has voted for it. */
export type BundleOption = {
    /** The bundle's position among those offered, to vote for it by. */
    index: number;
    card: Snapshot<CardInstance>;
    /** Whether this crew member's card is the bundle's standout, better than the others' cards. */
    standout: boolean;
    /** The crew members who have voted for this bundle. */
    voters: readonly CrewRoleName[];
};

/** Everything needed to show the cards a crew member is gaining or choosing between, outside of an encounter (see `useRewards`). */
export type RewardsModel = {
    crew: CrewRoleName;
    /** The first card waiting for room in this crew member's full deck, or null if there's none. */
    incomingCard: Snapshot<CardInstance> | null;
    /** How many cards are waiting for room, including `incomingCard`. */
    incomingCount: number;
    /** The crew member's deck, any card of which can be replaced by the incoming card. */
    deckCards: Snapshot<CardInstance[]>;
    maxDeckSize: number;
    /** Cards to choose one of at the first sector's outfitting station. */
    outfitCards: Snapshot<CardInstance[]>;
    /** What each of the bundles at a later outfitting station offers this crew member, in order. Empty elsewhere. */
    bundles: readonly BundleOption[];
    /** The index of the bundle this crew member voted for, or null. */
    vote: number | null;
    /** How many crew members have to vote for the same bundle for the ship to take it. */
    votesNeeded: number;
    replaceDeckCard: (cardId: number) => void;
    discardIncomingCard: () => void;
    takeOutfitCard: (cardId: number) => void;
    voteBundle: (bundleIndex: number) => void;
};

/** Salvage for the crew member who chooses which card the ship takes, during an encounter (see `useSalvage`). */
export type SalvageModel = {
    cards: Snapshot<SalvageCardInfo[]>;
    takeSalvage: (cardId: number) => void;
    scrapSalvage: () => void;
};
