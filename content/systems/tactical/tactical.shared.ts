import { defineSharedContent } from 'common-data/content/SharedContent';
import { cards } from './cards/tacticalCards.shared';
import { effects } from './effects/tacticalEffects.shared';

export { flareDuration } from './cards/tacticalCards.shared';

export const tacticalShared = defineSharedContent({ cards, effects });
