import { defineUiContent } from 'common-ui/content/UiContent';
import { cards } from './cards/engineerCards.ui';
import { effects } from './effects/engineerEffects.ui';
import { engineerShared } from './engineer.shared';

export const engineerUi = defineUiContent({
    shared: engineerShared,
    cards,
    effects,
});
