import { defineUiContent } from 'common-ui/content/UiContent';
import { cards } from './cards/tacticalCards.ui';
import { effects } from './effects/tacticalEffects.ui';
import { tacticalShared } from './tactical.shared';

export const tacticalUi = defineUiContent({
    shared: tacticalShared,
    cards,
    effects,
});
