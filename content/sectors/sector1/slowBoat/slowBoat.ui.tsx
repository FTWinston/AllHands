import { defineUiContent } from 'common-ui/content/UiContent';
import { drawings } from './ships/slowBoatShips.ui';
import { slowBoatShared } from './slowBoat.shared';

export const slowBoatUi = defineUiContent({
    shared: slowBoatShared,
    drawings,
});
