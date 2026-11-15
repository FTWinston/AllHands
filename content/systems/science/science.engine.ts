import { defineEngineContent } from 'engine/content/EngineContent';
import { cards } from './cards/scienceCards.engine';
import { effects } from './effects/scienceEffects.engine';
import { scienceShared } from './science.shared';

export const scienceEngine = defineEngineContent({
    shared: scienceShared,
    cards,
    effects,
});
