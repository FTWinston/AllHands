import type { Snapshot } from '@colyseus/react';
import type { CardInstance } from 'common-data/features/cards/types/CardInstance';

/** Everything needed to show a crew member's shop, at a shop station for their role (see `useShop`). */
export type ShopModel = {
    /** The kind of station, e.g. "Navigation beacon". */
    title: string;
    cards: Snapshot<CardInstance[]>;
    /** Antimatter spent to buy each card. */
    price: number;
    /** The ship's antimatter. */
    antimatter: number;
    /** When closed, only a button to reopen the shop is shown. */
    isOpen: boolean;
    buyCard: (cardId: number) => void;
    openShop: () => void;
    /** Closes the shop, telling the server. It can be reopened while at the station. */
    closeShop: () => void;
};
