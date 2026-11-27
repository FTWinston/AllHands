import { cardDefinitions, type CardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { CardDefinition } from 'common-data/features/cards/types/CardDefinition';
import type { CardRangePreset } from 'common-data/features/cards/types/CardRangeInfo';
import type { ShipSystem } from 'common-data/features/ships/types/ShipSystem';

/** The order the card range goes through the systems in: the crew's, then those whose cards play themselves. */
const systemOrder: readonly ShipSystem[] = ['helm', 'tactical', 'science', 'engineer', 'hull', 'reactor'];

export function getCardRangeDefinition(cardType: CardType): CardDefinition {
    return (cardDefinitions as Record<CardType, CardDefinition>)[cardType];
}

/**
 * Every card the card range goes through, system by system, each system's in the order they're defined.
 * A choice card's options are left out, as they're tried out by playing the choice card.
 */
export function getCardRangeCardTypes(): CardType[] {
    const all = Object.keys(cardDefinitions) as CardType[];

    const options = new Set<CardType>(all.flatMap((cardType) => {
        const definition = getCardRangeDefinition(cardType);
        return definition.targetType === 'choice' ? definition.cards : [];
    }));

    return all
        .filter(cardType => !options.has(cardType))
        .sort((a, b) => systemOrder.indexOf(getCardRangeDefinition(a).system) - systemOrder.indexOf(getCardRangeDefinition(b).system));
}

/** Cards that need something set up that their kind of card doesn't usually. Any card's preset can also be changed from the dev tools, which keep it. */
const presetOverrides: Partial<Record<CardType, CardRangePreset>> = {
    flare: 'incoming',
};

/** What's set up for a card unless another preset has been chosen for it: what its kind of card needs, as far as that can be told. */
export function getDefaultCardRangePreset(cardType: CardType): CardRangePreset {
    const override = presetOverrides[cardType];
    if (override) {
        return override;
    }

    const definition = getCardRangeDefinition(cardType);

    if (definition.targetType === 'weapon') {
        return 'armed';
    }

    if (definition.targetType === 'ship' && definition.targetRelationship === 'friendly') {
        return 'ally';
    }

    if (definition.system === 'engineer' && (definition.targetType === 'system' || definition.targetType === 'choice')) {
        return 'damaged';
    }

    return 'targets';
}
