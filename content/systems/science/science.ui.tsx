import { defineUiContent } from 'common-ui/content/UiContent';
import { cards } from './cards/scienceCards.ui';
import { effects } from './effects/scienceEffects.ui';
import { scienceShared } from './science.shared';

export const scienceUi = defineUiContent({
    shared: scienceShared,
    cards,
    effects,
});
