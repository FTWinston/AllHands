import type { CardType } from '../utils/cardDefinitions';

/** A card that a work order could deliver, shown before it's placed. */
export interface OrderPreviewCardInfo {
    /** Null for a card the crew hasn't come across yet, shown as an "unknown design". */
    type: CardType | null;
    /** Whether the crew member already has one of these in their deck. A delivery only offers these when there aren't enough new cards. */
    owned: boolean;
}
