import { defineEffects } from 'common-data/content/SharedContent';
import { evasivePatternDuration } from 'common-data/features/cards/utils/evasivePatterns';
import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';

/** The most Momentum a helm can hold. */
export const maxMomentum = 5;

/** How much faster each level of Momentum makes every maneuver, as a percentage of its speed. */
export const momentumSpeedPerLevel = 10;

/** How long each posture is held for, in milliseconds. */
export const lockOnDuration = 8_000;

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
    /** On the helm: the ship is holding still, aimed at a target (see the Lock On card), so its own weapons hit more often. Its level is the accuracy it adds, in percentage points. */
    holdingSteady: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: 100,
        duration: lockOnDuration,
    },
    /** On the helm: the ship is jinking (see the Evasive Maneuvers card), so its own weapons hit less often. Its level is the accuracy it takes away, in percentage points. */
    jinking: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        maxLevel: 100,
        duration: evasivePatternDuration,
    },
    /**
     * On the tactical system: the ship is on an attack run (see the Attack Run card), so tactical has more power. Its level is how much more.
     * Helm adds it when the maneuver starts and removes it when that ends, however it ends.
     */
    attackRun: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: 3,
    },
    /**
     * On the helm of a ship that another is interposing for (see the Interpose card): hostile shots at it can be taken by that ship instead, if it's in the way.
     * Which ship that is lives in the engine (see `getInterposer`). Helm adds it when the maneuver starts and removes it when that ends, however it ends.
     */
    screened: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
    },
});

/** How close to the line of fire an interposing ship has to be to take a shot meant for the ship it's protecting, in units. */
export const interposeBlockRadius = 1.5;
