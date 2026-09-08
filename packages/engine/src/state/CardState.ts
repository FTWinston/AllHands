import { IMap } from '@colyseus/react';
import { MapSchema, Schema, type } from '@colyseus/schema';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { CardTrait } from 'common-data/features/cards/types/CardTrait';
import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';

import { resolveParameter, resolveParameters } from 'src/cards/resolveParameters';
import { getCardDefinition } from '../cards/getEngineCardDefinition';

export class CardState extends Schema implements CardInstance {
    constructor(id: number, type: CardType, modifiers = new MapSchema<number>()) {
        super();
        this.id = id;
        this.type = type;
        this.modifiers = modifiers;
    }

    @type('number') readonly id: number;
    @type('string') readonly type: CardType;
    @type('boolean') damaged: boolean = false;
    @type({ map: 'number' }) readonly modifiers: MapSchema<number>;

    /**
     * Keys are traits granted to this specific card instance, in addition to its definition's fixed traits.
     * Values are whether the trait should be removed when the card is played.
    */
    @type({ map: 'number' }) readonly extraTraits = new MapSchema<ExtraTraitType, CardTrait>();

    getParameters(additionalModifiers?: IMap<string, number> | null): CardParameters {
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

    hasTrait(trait: CardTrait): boolean {
        return getCardDefinition(this.type).traits?.includes(trait)
            || this.extraTraits?.has(trait);
    }

    addTrait(trait: CardTrait, type: ExtraTraitType) {
        this.extraTraits.set(trait, type);
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

    cloneCard(newId = this.id) {
        const card = new CardState(newId, this.type);
        for (const [key, value] of this.modifiers) {
            card.modifiers.set(key, value);
        }
        for (const [trait, removeOnPlay] of this.extraTraits) {
            card.extraTraits.set(trait, removeOnPlay);
        }
        return card;
    }

    createExpendableCopy(newid: number) {
        const newCard = this.cloneCard(newid);
        newCard.addTrait('expendable', ExtraTraitType.Normal);
        return newCard;
    }
}
