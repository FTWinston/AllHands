import { CardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { CardTrait } from 'common-data/features/cards/types/CardTrait';
import { CardType, cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { Children, isValidElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { Trait } from '../components/Trait';
import { getCardDefinition } from './getUiCardDefinition';

/**
 * Recursively extract all Trait components from a ReactNode tree
 * and return their trait types.
 */
function extractTraitsFromDescription(description: ReactNode): CardTrait[] {
    const traits: CardTrait[] = [];

    function traverse(node: ReactNode): void {
        if (!node) {
            return;
        }

        if (isValidElement(node)) {
            // Check if this element is a Trait component
            if (node.type === Trait) {
                const props = node.props as { type: CardTrait };
                traits.push(props.type);
            }

            // Recursively check children
            const props = node.props as { children?: ReactNode };
            if (props.children) {
                Children.forEach(props.children, traverse);
            }
        } else if (Array.isArray(node)) {
            node.forEach(traverse);
        }
    }

    traverse(description);
    return traits;
}

describe('Card trait consistency', () => {
    const cardTypes = Object.keys(cardDefinitions) as CardType[];

    describe.each(cardTypes)('%s', (cardType) => {
        it('should have Trait components in description that match card definition traits', () => {
            const dataDefinition = cardDefinitions[cardType] as CardDefinition;
            const uiDefinition = getCardDefinition(cardType);

            const definitionTraits = dataDefinition.traits ?? [];
            const descriptionTraits = extractTraitsFromDescription(uiDefinition.description);

            // Every Trait component in the description should correspond to a trait on the card definition
            for (const descTrait of descriptionTraits) {
                expect(
                    definitionTraits,
                    `Description contains Trait "${descTrait}" but card definition doesn't have this trait`
                ).toContain(descTrait);
            }

            // Every trait on the card definition should have a corresponding Trait component in the description
            for (const defTrait of definitionTraits) {
                expect(
                    descriptionTraits,
                    `Card definition has trait "${defTrait}" but description doesn't include a Trait component for it`
                ).toContain(defTrait);
            }
        });
    });
});
