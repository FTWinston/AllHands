import type { Snapshot } from '@colyseus/react';
import type { CardInstance } from 'common-data/features/cards/types/CardInstance';

/** Everything needed to show a crew member's open shop, at a shop station for their role (see `useShop`). */
export type ShopControl = {
    /** The kind of station, e.g. "Navigation beacon". */
    title: string;
    cards: Snapshot<CardInstance[]>;
    /** Antimatter spent to buy each card. */
    price: number;
    /** The ship's antimatter. */
    antimatter: number;
    buyCard: (cardId: number) => void;
    /** Closes the shop for good. */
    closeShop: () => void;
};
