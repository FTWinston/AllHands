import { defineSharedContent } from 'common-data/content/SharedContent';
import { cards } from './cards/weaponTraitsCards.shared';
import { effects } from './effects/weaponTraitsEffects.shared';

export { disruptedDamage } from './cards/weaponTraitsCards.shared';
export { persistentDamageDuration, persistentDamageInterval, powerDrainDuration, systemDisabledDuration } from './effects/weaponTraitsEffects.shared';

/** What weapon traits leave behind on the system a shot lands on: the effects, and the Disrupted cards. */
export const weaponTraitsShared = defineSharedContent({ cards, effects });
