import { defineUiContent } from 'common-ui/content/UiContent';
import { deadWeightShared } from './deadWeight.shared';
import { drawings } from './ships/deadWeightShips.ui';

export const deadWeightUi = defineUiContent({
    shared: deadWeightShared,
    drawings,
});
