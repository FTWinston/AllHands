import { defineEffects } from 'common-data/content/SharedContent';
import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';

/** How long the mark of the quarantine gate's pulse stays on the system it landed on. */
export const gatePulseDuration = 4000;

/** How long a Shutdown Key stays turned, once it's played. */
export const keyTurnedDuration = 5000;

/** How long Key Power keeps a system a level up, which is long enough to power all four of a ship's keys in turn, and not much longer. */
export const keyPowerDuration = 10_000;

export const effects = defineEffects({
    /** What the quarantine gate's pulse leaves behind, each time its master pylon changes its shields. It does nothing: when it lands is what matters. */
    gatePulse: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
        duration: gatePulseDuration,
    },
    /** This system runs a level higher for a while (see the Key Power card). Unlike Aux Power, any number of a ship's systems can have it at once. */
    keyPower: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: keyPowerDuration,
    },
    /** This system's Shutdown Key is turned. It does nothing itself: the gate listens for all four of a ship's being turned at once. */
    keyTurned: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
        duration: keyTurnedDuration,
    },
});
