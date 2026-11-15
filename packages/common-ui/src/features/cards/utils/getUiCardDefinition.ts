import type { CardDescription, UICardDefinition } from '../types/UICardDefinition';
import type { CardDefinition } from 'common-data/features/cards/types/CardDefinition';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';

/** Every registered card, with how it's described. Filled by `registerUiContent`. */
const uiCardDefinitions = new Map<string, UICardDefinition>();

/** Register the given cards, with how each one is described. */
export function registerCardDescriptions(cards: Readonly<Record<string, CardDefinition<string>>>, descriptions: Readonly<Record<string, CardDescription>>) {
    for (const [type, definition] of Object.entries(cards)) {
        if (uiCardDefinitions.has(type)) {
            throw new Error(`Card registered twice: ${type}`);
        }
        uiCardDefinitions.set(type, { ...definition, ...descriptions[type] } as UICardDefinition);
    }
}

export const getCardDefinition = (type: CardType): UICardDefinition => {
    const cardDef = uiCardDefinitions.get(type);

    if (!cardDef) {
        throw new Error(`Card definition not found: ${type}`);
    }

    return cardDef;
};
