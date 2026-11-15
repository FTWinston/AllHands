import { defineUiContent } from 'common-ui/content/UiContent';
import { feverShipShared } from './feverShip.shared';
import { drawings } from './ships/feverShipShips.ui';

export const feverShipUi = defineUiContent({
    shared: feverShipShared,
    drawings,
});
