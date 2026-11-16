import { defineUiContent } from 'common-ui/content/UiContent';
import { cards } from './cards/weaponTraitsCards.ui';
import { effects } from './effects/weaponTraitsEffects.ui';
import { weaponTraitsShared } from './weaponTraits.shared';

export const weaponTraitsUi = defineUiContent({
    shared: weaponTraitsShared,
    cards,
    effects,
});
