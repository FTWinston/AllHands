import { isSoundEnabled } from './soundSettings';

/** Vibration patterns, in milliseconds of alternating vibration and pause. */
export const vibrations = {
    /** Your own system has been damaged. */
    ownSystemDamaged: [150, 60, 250],
    /** The ship has taken a hit somewhere. */
    shipHit: [60],
};

/**
 * Vibrate the device, if it supports it and sound effects are enabled.
 * A new vibration replaces any that's still going. (iOS Safari doesn't support vibration at all.)
 */
export function vibrate(pattern: number[]) {
    if (isSoundEnabled() && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}
