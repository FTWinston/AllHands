import { defineUiContent } from 'common-ui/content/UiContent';
import { effects } from './effects/standingOrdersEffects.ui';
import { drawings } from './ships/standingOrdersShips.ui';
import { standingOrdersShared } from './standingOrders.shared';

export const standingOrdersUi = defineUiContent({
    shared: standingOrdersShared,
    effects,
    drawings,
});
