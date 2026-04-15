import { isValidElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { CardType, cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { CardTrait } from 'common-data/features/cards/types/CardTrait';
import { Trait } from '../components/Trait';
import { getCardDefinition } from './getUiCardDefinition';

/**
 * Recursively walk a React element tree and collect all trait types
 * rendered by the Trait component.
 */
function findTraitTypes(node: ReactNode): CardTrait[] {
    if (!isValidElement(node)) {
        if (Array.isArray(node)) {
            return node.flatMap(findTraitTypes);
        }
        return [];
    }

    const traits: CardTrait[] = [];

    if (node.type === Trait) {
        traits.push((node.props as { type: CardTrait }).type);
    }

    const { children } = node.props as { children?: ReactNode };
    if (children !== undefined) {
        if (Array.isArray(children)) {
            traits.push(...children.flatMap(findTraitTypes));
        } else {
            traits.push(...findTraitTypes(children));
        }
    }

    return traits;
}

describe('getUiCardDefinition', () => {
    const allCardTypes = Object.keys(cardDefinitions) as CardType[];

    it.each(allCardTypes)('%s description displays the correct traits', (cardType) => {
        const uiDef = getCardDefinition(cardType);
        const expectedTraits = uiDef.traits ?? [];

        const displayedTraits = findTraitTypes(uiDef.description);

        expect(displayedTraits).toEqual(expectedTraits);
    });
});
