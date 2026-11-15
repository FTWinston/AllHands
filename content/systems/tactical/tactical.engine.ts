import { defineEngineContent } from 'engine/content/EngineContent';
import { cards } from './cards/tacticalCards.engine';
import { effects } from './effects/tacticalEffects.engine';
import { tacticalShared } from './tactical.shared';

export const tacticalEngine = defineEngineContent({
    shared: tacticalShared,
    cards,
    effects,
});
