import type { CardType } from '../utils/cardDefinitions';
import type { ShipSystem } from 'src/features/ships/types/ShipSystem';

/** The dev tools' card range: an encounter for trying out every card in turn, against targets that do as little as each card needs. */
export const cardRangeEncounterId = 'cardRange';

/** What's set up around the player ship for a card to be tried out against. */
export const cardRangePresets = ['targets', 'incoming', 'live', 'ally', 'armed', 'damaged'] as const;

export type CardRangePreset = (typeof cardRangePresets)[number];

export function isCardRangePreset(value: unknown): value is CardRangePreset {
    return cardRangePresets.includes(value as CardRangePreset);
}

/** How trying a card out went. */
export type CardRangeStatus = 'pass' | 'fail' | 'skip';

export function isCardRangeStatus(value: unknown): value is CardRangeStatus {
    return value === 'pass' || value === 'fail' || value === 'skip';
}

export interface CardRangeCardInfo {
    type: CardType;
    system: ShipSystem;
    /** What's set up for it: the preset chosen for it, or the default for its kind of card. */
    preset: CardRangePreset;
    status?: CardRangeStatus;
    note?: string;
}

/** What the dev tools show of the card range: every card, in the order they're tried, and how each went. */
export interface CardRangeInfo {
    cards: CardRangeCardInfo[];
    /** The index in `cards` of the card being tried. */
    currentIndex: number;
    /** Whether the card range encounter is running. */
    active: boolean;
    /** Where how each card went is kept, between games. */
    progressFile: string;
}

/** What the dev tools can ask of the card range (sent as `devCardRange`). Each sets the range up afresh, but for `replay` and `mark`. */
export type CardRangeCommand
    /** Try out this card, loading the card range encounter if it isn't running. */
    = | { action: 'go'; cardType: CardType }
        /** Try out the next or previous card, or the next or previous one without a status. */
        | { action: 'step'; delta: 1 | -1; untestedOnly?: boolean }
        /** Deal the card being tried again, without setting anything else up afresh. */
        | { action: 'replay' }
        /** Set the card being tried up afresh. */
        | { action: 'reset' }
        /** Record how the card being tried went. A null status clears it. A note left out is kept; an empty one is cleared. */
        | { action: 'mark'; status: CardRangeStatus | null; note?: string }
        /** Change what's set up for the card being tried, from now on. */
        | { action: 'preset'; preset: CardRangePreset };
