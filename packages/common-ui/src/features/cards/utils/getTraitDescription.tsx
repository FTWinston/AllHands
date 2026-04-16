import { CardTrait } from 'common-data/features/cards/types/CardTrait';

function getTraitDescriptions() {
    const traitDescriptions: Record<CardTrait, string> = {
        primary: 'Card returns to hand when played (if no other primary card in hand)',
        expendable: 'Card is destroyed when played (not added to discard pile).',
    };

    return traitDescriptions;
}

const traitDescriptions = getTraitDescriptions();

export const getTraitDescription = (trait: CardTrait): string => {
    const description = traitDescriptions[trait];

    if (!description) {
        throw new Error(`Card trait not found: ${trait}`);
    }

    return description;
};
