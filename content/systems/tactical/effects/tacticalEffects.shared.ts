import { defineEffects } from 'common-data/content/SharedContent';
import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';

/** How long a flare burns, once the Flare card is played. */
export const flareDuration = 8000;

/** How long a tractor beam holds its target, unless it breaks first. */
export const tractorBeamDuration = 8000;

export const effects = defineEffects({
    /** On a ship's tactical system: a flare it launched is burning. It does nothing itself: an encounter decides what that's worth. */
    flareBurning: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
        duration: flareDuration,
    },
    /** On a ship's tactical system: Lock held against one other ship (see `TacticalState.lockTargetId`). Each level makes every shot at that ship more accurate. */
    lock: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: 5,
    },
    /** On the helm of a ship held in another's tractor beam. Its level is the percentage of speed that manoeuvres started under it lose. */
    heldByTractorBeam: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        duration: tractorBeamDuration,
        tickInterval: 250,
    },
    /** On the helm of a ship holding another in its tractor beam. Its level is the percentage of speed that its own manoeuvres lose, as it's towing. */
    tractorBeamEngaged: {
        category: SystemEffectCategory.Neutral,
        usesLevels: true,
        duration: tractorBeamDuration,
        tickInterval: 250,
    },
});
