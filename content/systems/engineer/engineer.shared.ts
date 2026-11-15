import { defineSharedContent } from 'common-data/content/SharedContent';
import { cards } from './cards/engineerCards.shared';
import { effects } from './effects/engineerEffects.shared';

export { transferPowerDuration, transferPowerRange, runQuietPowerLoss } from './cards/engineerCards.shared';

export const engineerShared = defineSharedContent({ cards, effects });
