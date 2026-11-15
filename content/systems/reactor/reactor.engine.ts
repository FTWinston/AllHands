import { defineEngineContent } from 'engine/content/EngineContent';
import { cards } from './cards/reactorCards.engine';
import { effects } from './effects/reactorEffects.engine';
import { reactorShared } from './reactor.shared';

export const reactorEngine = defineEngineContent({
    shared: reactorShared,
    cards,
    effects,
});
