import { defineSharedContent } from 'common-data/content/SharedContent';
import { effects } from './effects/standingOrdersEffects.shared';

export { inspectionPingDuration } from './effects/standingOrdersEffects.shared';

export const standingOrdersShared = defineSharedContent({ effects });
