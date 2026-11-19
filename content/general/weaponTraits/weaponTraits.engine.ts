import { defineEngineContent } from 'engine/content/EngineContent';
import { cards } from './cards/weaponTraitsCards.engine';
import { effects } from './effects/weaponTraitsEffects.engine';
import { weaponTraitsShared } from './weaponTraits.shared';

export const weaponTraitsEngine = defineEngineContent({
    shared: weaponTraitsShared,
    cards,
    effects,
});
