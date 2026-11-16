import { defineEffects } from 'common-data/content/SharedContent';
import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';

/** How long a hit from a persistent weapon keeps damaging the system it landed on. */
export const persistentDamageDuration = 8_000;

/** How often a hit from a persistent weapon damages the system it landed on. */
export const persistentDamageInterval = 2_000;

/** How long a hit from a draining weapon takes power from the system it landed on. */
export const powerDrainDuration = 8_000;

/** How long a hit from a disabling weapon stops the system it landed on from playing cards. */
export const systemDisabledDuration = 4_000;

// The effects that weapon traits leave on the system a shot lands on (see `applyWeaponTrait`). Another hit with the same trait starts the time over.
export const effects = defineEffects({
    /** Left by a persistent weapon. Its level is the damage done to the system each time it ticks. */
    persistentDamage: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        duration: persistentDamageDuration,
        tickInterval: persistentDamageInterval,
    },
    /** Left by a draining weapon. Its level is the power taken from the system. */
    powerDrain: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        duration: powerDrainDuration,
    },
    /** Left by a disabling weapon: every card in the system's hand is unplayable while it lasts. */
    systemDisabled: {
        category: SystemEffectCategory.Negative,
        usesLevels: false,
        duration: systemDisabledDuration,
    },
});
