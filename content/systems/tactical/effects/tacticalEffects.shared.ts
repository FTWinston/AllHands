import { defineEffects } from 'common-data/content/SharedContent';
import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';

/** How long a flare burns, once the Flare card is played. */
export const flareDuration = 8000;

/** How long weapons are held, once the Hold Fire card is played. */
export const holdFireDuration = 6000;

/** The levels of Lock gained on the locked ship when Hold Fire ends. */
export const holdFireLockGain = 2;

/** How long a called shot can be taken for, once the Called Shot card is played. */
export const calledShotDuration = 10000;

export const effects = defineEffects({
    /** On a ship's tactical system: a flare it launched is burning. It does nothing itself: an encounter decides what that's worth. */
    flareBurning: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
        duration: flareDuration,
    },
    /** On a ship's tactical system: its weapons can't fire (see the Hold Fire card). When it runs out, Lock is gained on the ship that was locked. */
    holdingFire: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
        duration: holdFireDuration,
    },
    /** On a ship's tactical system: every crew system of the locked ship can be aimed at, until the next shot at it (see the Called Shot card). */
    calledShot: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: calledShotDuration,
    },
    /** On a ship's tactical system: Lock held against one other ship (see `TacticalState.lockTargetId`). Each level makes every shot at that ship more accurate. */
    lock: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: 5,
    },
    /**
     * On the helm of a ship held in another's tractor beam. Its level is the percentage of speed that manoeuvres started under it lose.
     * It lasts for as long as the Tractor Beam weapon holding the ship stays active, unless the ships get too far apart first,
     * or the held ship starts a manoeuvre with more power at its helm than the holder has at its tactical, which breaks it.
     */
    heldByTractorBeam: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        tickInterval: 250,
    },
    /**
     * On the helm of a ship holding another in its tractor beam. Its level is the percentage of speed that its own manoeuvres lose, as it's towing.
     * It lasts for as long as its Tractor Beam weapon stays active, unless the ships get too far apart first.
     */
    tractorBeamEngaged: {
        category: SystemEffectCategory.Neutral,
        usesLevels: true,
        tickInterval: 250,
    },
});
