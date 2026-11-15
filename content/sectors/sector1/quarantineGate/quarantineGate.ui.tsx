import { defineUiContent } from 'common-ui/content/UiContent';
import { cards } from './cards/quarantineGateCards.ui';
import { effects } from './effects/quarantineGateEffects.ui';
import { quarantineGateShared } from './quarantineGate.shared';
import { drawings } from './ships/quarantineGateShips.ui';

export const quarantineGateUi = defineUiContent({
    shared: quarantineGateShared,
    cards,
    effects,
    drawings,
});
