import { defineEffects } from 'common-data/content/SharedContent';
import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';

/** How long a shield tuning lasts after the hull card that set it is played, unless another hull card renews or replaces it. */
export const shieldTuningDuration = 12_000;

export const effects = defineEffects({
    /** A shield tuning, set by playing an emitter: the shields are drained less by what they absorb (see shieldStats). */
    shieldReinforced: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: shieldTuningDuration,
    },
    /** A shield tuning, set by playing an energy tuning card: hits from energy weapons do less damage. */
    shieldTunedEnergy: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: shieldTuningDuration,
    },
    /** A shield tuning, set by playing a torpedo tuning card: torpedo hits do less damage. */
    shieldTunedTorpedo: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: shieldTuningDuration,
    },
});
