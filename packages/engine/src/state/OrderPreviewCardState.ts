import { Schema, type } from '@colyseus/schema';
import type { OrderPreviewCardInfo } from 'common-data/features/cards/types/OrderPreviewCardInfo';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';

export class OrderPreviewCardState extends Schema implements OrderPreviewCardInfo {
    constructor(type: CardType | null, owned: boolean) {
        super();
        this.type = type;
        this.owned = owned;
    }

    @type('string') readonly type: CardType | null;
    @type('boolean') readonly owned: boolean;
}
