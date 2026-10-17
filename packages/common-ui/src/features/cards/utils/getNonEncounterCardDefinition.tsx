import { getRouteCardDescription } from './getRouteCardDescription';
import type { UICardDefinition } from '../types/UICardDefinition';
import type { Snapshot } from '@colyseus/react';
import type { NonEncounterCardInfo } from 'common-data/features/cards/types/NonEncounterCardInfo';
import type { ShipSystem } from 'common-data/features/ships/types/ShipSystem';

/** Non-encounter cards are not card definitions, so what they show is built from the card itself. */
export function getNonEncounterCardDefinition(card: Snapshot<NonEncounterCardInfo>, system: ShipSystem): UICardDefinition {
    const common = {
        targetType: 'no-target',
        system,
        parameters: { cost: 0 },
        traits: ['priority'],
    } as const;

    switch (card.kind) {
        case 'route':
            if (!card.route) {
                throw new Error('Route card has no route');
            }

            return { ...common, ...getRouteCardDescription(card.route) };
        default:
            throw new Error(`Non-encounter card kind not found: ${card.kind satisfies never}`);
    }
}
