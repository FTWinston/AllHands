import { defineEngineContent } from 'engine/content/EngineContent';
import { cards } from './cards/hullCards.engine';
import { effects } from './effects/hullEffects.engine';
import { hullShared } from './hull.shared';

export const hullEngine = defineEngineContent({
    shared: hullShared,
    cards,
    effects,
});
