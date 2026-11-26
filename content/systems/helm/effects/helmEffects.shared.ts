import { defineEffects } from 'common-data/content/SharedContent';
import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';

/** The most Momentum a helm can hold. */
export const maxMomentum = 5;

/** How much faster each level of Momentum makes every maneuver, as a percentage of its speed. */
export const momentumSpeedPerLevel = 10;

/** How long each posture is held for, in milliseconds. */
export const holdSteadyDuration = 6_000;
export const evasivePatternDuration = 5_000;

export const effects = defineEffects({
    /**
     * On the helm: built by flying one maneuver straight after another, and by cards that add to it. Each level speeds every maneuver up.
     * A level is lost each time the ship is hit, and all of them when the ship sits still for too long (see `HelmState`).
     */
    momentum: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: maxMomentum,
    },
    /** On the helm: the ship is harder to hit after a Hard Brake. Its level is the evasion it adds, in percentage points. */
    /** On the helm: the ship is holding still (see the Hold Steady card), so its own weapons hit more often. Its level is the accuracy it adds, in percentage points. */
    holdingSteady: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: 100,
        duration: holdSteadyDuration,
    },
    /** On the helm: the ship is jinking (see the Evasive Pattern card), so its own weapons hit less often. Its level is the accuracy it takes away, in percentage points. */
    jinking: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        maxLevel: 100,
        duration: evasivePatternDuration,
    },
    /**
     * On the tactical system: the ship is on an attack run (see the Attack Run card), so every tactical card costs less to play. Its level is how much less.
     * Helm adds it when the maneuver starts and removes it when that ends, however it ends.
     */
    attackRun: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: 3,
    },
});
