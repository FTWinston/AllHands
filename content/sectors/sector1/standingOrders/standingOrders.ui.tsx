import { defineUiContent } from 'common-ui/content/UiContent';
import { effects } from './effects/standingOrdersEffects.ui';
import { standingOrdersShared } from './standingOrders.shared';

export const standingOrdersUi = defineUiContent({
    shared: standingOrdersShared,
    effects,
});
