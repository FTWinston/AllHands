import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { getShieldCapacity, ShieldStatCard } from 'common-data/features/ships/utils/shieldStats';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { resolveParameter } from 'common-ui/types/resolveParameters';
import type { Snapshot } from '@colyseus/react';

const toShieldStatCard = (card: Snapshot<CardInstance>): ShieldStatCard => {
    const traits = card.extraTraits as Partial<Record<string, unknown>> | undefined;
    const modifiers = card.modifiers as Partial<Record<string, number>> | undefined;

    return {
        isDamaged: traits?.['damaged'] !== undefined || traits?.['critical'] !== undefined,
        getParameter: parameter => resolveParameter(parameter, getCardDefinition(card.type).parameters, modifiers),
    };
};

/** The hull's shield capacity, worked out from all of its cards the same way the engine does. */
export function getHullShieldCapacity(cards: Snapshot<CardInstance[]>) {
    return getShieldCapacity(cards.map(toShieldStatCard));
}
