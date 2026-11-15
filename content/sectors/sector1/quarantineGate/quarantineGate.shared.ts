import { defineSharedContent } from 'common-data/content/SharedContent';
import { cards } from './cards/quarantineGateCards.shared';
import { effects } from './effects/quarantineGateEffects.shared';

export { gatePulseDuration, keyPowerDuration, keyTurnedDuration } from './effects/quarantineGateEffects.shared';

export const quarantineGateShared = defineSharedContent({ cards, effects });
