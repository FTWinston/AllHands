import { defineEngineContent } from 'engine/content/EngineContent';
import { cards } from './cards/helmCards.engine';
import { effects } from './effects/helmEffects.engine';
import { helmShared } from './helm.shared';

export const helmEngine = defineEngineContent({
    shared: helmShared,
    cards,
    effects,
});
