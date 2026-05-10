import { MapSchema, Schema, type } from '@colyseus/schema';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { resolveParameter, resolveParameters } from 'common-data/features/cards/utils/resolveParameters';
import { MinimalReadonlyMap } from 'common-data/types/MinimalArray';
import { getCardDefinition } from '../cards/getEngineCardDefinition';

export class CardState extends Schema implements CardInstance {
    constructor(id: number, type: CardType) {
        super();
        this.id = id;
        this.type = type;
    }

    @type('number') readonly id: number;
    @type('string') readonly type: CardType;
    @type({ map: 'number' }) readonly modifiers = new MapSchema<number>();

    getParameters(additionalModifiers?: MinimalReadonlyMap<string, number> | null): CardParameters {
        const definition = getCardDefinition(this.type);

        return resolveParameters(definition.parameters, this.modifiers, additionalModifiers);
    }

    getParameter(parameter: string): number {
        const definition = getCardDefinition(this.type);

        return resolveParameter(parameter, definition.parameters, this.modifiers);
    }

    hasParameter(parameter: string): boolean {
        const definition = getCardDefinition(this.type);

        return parameter in definition.parameters;
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
