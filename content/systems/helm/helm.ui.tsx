import { defineUiContent } from 'common-ui/content/UiContent';
import { cards } from './cards/helmCards.ui';
import { effects } from './effects/helmEffects.ui';
import { helmShared } from './helm.shared';

export const helmUi = defineUiContent({
    shared: helmShared,
    cards,
    effects,
});
