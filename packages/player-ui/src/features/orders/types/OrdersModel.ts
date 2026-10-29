import type { Snapshot } from '@colyseus/react';
import type { CardInstance } from 'common-data/features/cards/types/CardInstance';
import type { OrderPreviewCardInfo } from 'common-data/features/cards/types/OrderPreviewCardInfo';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';

/** Everything needed to show a crew member's work orders, outside of an encounter (see `useOrders`). */
export type OrdersModel = {
    crew: CrewRoleName;
    /** At a shop station for another crew member, a work order can be placed. */
    canOrder: boolean;
    /** Antimatter spent to place the next work order. */
    price: number;
    /** The ship's antimatter. */
    antimatter: number;
    /** The crew member's deck, any card of which could be the spec for an order. */
    deckCards: Snapshot<CardInstance[]>;
    /** Ids of the deck cards that a work order can be placed for. */
    orderableCardIds: readonly number[];
    /** The type of the card a work order is pending for, which is delivered at the next station. */
    pendingOrder: CardType | null;
    /** The deck card whose possible deliveries are in `preview`, or null if none has been previewed. */
    previewCardId: number | null;
    preview: Snapshot<OrderPreviewCardInfo[]>;
    /** Cards delivered by a work order, to choose one of. */
    deliveryCards: Snapshot<CardInstance[]>;
    previewOrder: (cardId: number) => void;
    placeOrder: (cardId: number) => void;
    takeDelivery: (cardId: number) => void;
};
