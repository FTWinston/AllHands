import { defineUiContent } from 'common-ui/content/UiContent';
import { cards } from './cards/reactorCards.ui';
import { effects } from './effects/reactorEffects.ui';
import { reactorShared } from './reactor.shared';

export const reactorUi = defineUiContent({
    shared: reactorShared,
    cards,
    effects,
});
