import { MapSchema, Schema, type } from '@colyseus/schema';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';

export class CardState extends Schema implements CardInstance {
    constructor(id: number, type: CardType) {
        super();
        this.id = id;
        this.type = type;
    }

    @type('number') id: number;
    @type('string') type: CardType;
    @type({ map: 'number' }) modifiers = new MapSchema<number>();

    hasParameter(parameter: string): boolean {
        const definition = getCardDefinition(this.type);

        return definition.parameters?.has(parameter) ?? false;
    }

    modifyParameter(parameter: string, adjustment: number) {
        if (!this.hasParameter(parameter)) {
            return;
        }

        const current = this.modifiers.get(parameter) || 0;
        const adjusted = current + adjustment;

        if (adjusted === 0) {
            this.modifiers.delete(parameter);
        } else {
            this.modifiers.set(parameter, adjusted);
        }
    }
}
