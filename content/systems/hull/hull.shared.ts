import { defineSharedContent } from 'common-data/content/SharedContent';
import { cards } from './cards/hullCards.shared';
import { effects } from './effects/hullEffects.shared';

export { shieldTuningDuration } from './effects/hullEffects.shared';

export const hullShared = defineSharedContent({ cards, effects });
