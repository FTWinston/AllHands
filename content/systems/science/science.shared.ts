import { defineSharedContent } from 'common-data/content/SharedContent';
import { cards } from './cards/scienceCards.shared';
import { effects } from './effects/scienceEffects.shared';

export const scienceShared = defineSharedContent({ cards, effects });
