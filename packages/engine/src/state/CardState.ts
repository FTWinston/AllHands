import { Schema, type } from '@colyseus/schema';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';

export class CardState extends Schema implements CardInstance {
    constructor(id: number, type: CardType) {
        super();
        this.id = id;
        this.type = type;
    }

    @type('number') id: number;
    @type('string') type: CardType;
}
