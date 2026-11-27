import { defineEngineContent } from 'engine/content/EngineContent';
import { applyDeflector } from './applyDeflector.engine';
import { mapDeflectorCards } from './deflectorParts.shared';
import { deflectorsShared } from './deflectors.shared';
import type { EnemyTargetCardFunctionality } from 'engine/cards/EngineCardDefinition';

export const deflectorsEngine = defineEngineContent({
    shared: deflectorsShared,
    // Each combination of parts' deflector card plays by firing a deflector loaded with those parts.
    cards: mapDeflectorCards((parts): EnemyTargetCardFunctionality => ({
        play: (gameState, ship, target) => applyDeflector(gameState, ship, target, parts),
    })),
});
