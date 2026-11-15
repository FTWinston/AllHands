import { defineSharedContent } from 'common-data/content/SharedContent';
import { cards } from './cards/helmCards.shared';
import { effects } from './effects/helmEffects.shared';

export const helmShared = defineSharedContent({ cards, effects });
