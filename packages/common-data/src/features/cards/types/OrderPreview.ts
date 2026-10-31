import type { CardType } from '../utils/cardDefinitions';

/** A card that a work order could deliver, shown before it's placed. */
export interface OrderPreviewCard {
    /** Null for a card the crew hasn't come across yet, shown as an "unknown design". */
    type: CardType | null;
    /** Whether the crew member already has one of these in their deck. A delivery only offers these when there aren't enough new cards. */
    owned: boolean;
}

/** Sent to a crew member who asks what a work order for one of their deck cards could deliver. */
export interface OrderPreview {
    /** The deck card the order would be placed for. */
    specCardId: number;
    cards: OrderPreviewCard[];
}
