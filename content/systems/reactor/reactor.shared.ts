import { defineSharedContent } from 'common-data/content/SharedContent';
import { cards } from './cards/reactorCards.shared';
import { effects } from './effects/reactorEffects.shared';

export const reactorShared = defineSharedContent({ cards, effects });
