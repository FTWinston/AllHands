import { defineUiContent } from 'common-ui/content/UiContent';
import { cards } from './cards/hullCards.ui';
import { effects } from './effects/hullEffects.ui';
import { hullShared } from './hull.shared';

export const hullUi = defineUiContent({
    shared: hullShared,
    cards,
    effects,
});
