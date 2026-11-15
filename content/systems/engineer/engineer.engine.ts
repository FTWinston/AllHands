import { defineEngineContent } from 'engine/content/EngineContent';
import { cards } from './cards/engineerCards.engine';
import { effects } from './effects/engineerEffects.engine';
import { engineerShared } from './engineer.shared';

export const engineerEngine = defineEngineContent({
    shared: engineerShared,
    cards,
    effects,
});
