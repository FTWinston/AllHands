import { defineUiContent } from 'common-ui/content/UiContent';
import { quietRunningShared } from './quietRunning.shared';
import { drawings } from './ships/quietRunningShips.ui';

export const quietRunningUi = defineUiContent({
    shared: quietRunningShared,
    drawings,
});
