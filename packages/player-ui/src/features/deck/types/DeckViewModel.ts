import type { Snapshot } from '@colyseus/react';
import type { CardInstance } from 'common-data/features/cards/types/CardInstance';
import type { ReactNode } from 'react';

/** Everything needed to show a crew member's "my deck" view, outside of an encounter (see `useDeckView`). */
export type DeckViewModel = {
    /** The crew member's deck, in draw order. */
    cards: Snapshot<CardInstance[]>;
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    /** At a station, cards can be re-ordered and sold, and the view opens automatically on arrival. */
    atStation: boolean;
    /** The ship's antimatter, shown at a station. */
    antimatter: number;
    moveCard: (cardId: number, toIndex: number) => void;
    sellCard: (cardId: number) => void;
    /** Shown beside the deck, e.g. a station's shop. */
    aside?: ReactNode;
};
