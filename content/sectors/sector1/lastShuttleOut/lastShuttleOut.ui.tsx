import { defineUiContent } from 'common-ui/content/UiContent';
import { lastShuttleOutShared } from './lastShuttleOut.shared';
import { drawings } from './ships/lastShuttleOutShips.ui';

export const lastShuttleOutUi = defineUiContent({
    shared: lastShuttleOutShared,
    drawings,
});
