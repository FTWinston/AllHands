import type { Snapshot } from '@colyseus/react';
import type { CardInstance } from 'common-data/features/cards/types/CardInstance';

/** Everything needed to show a crew member's shop, at a shop station for their role (see `useShop`). */
export type ShopModel = {
    cards: Snapshot<CardInstance[]>;
    /** Antimatter spent to buy each card. */
    price: number;
    /** The ship's antimatter. */
    antimatter: number;
    buyCard: (cardId: number) => void;
};
