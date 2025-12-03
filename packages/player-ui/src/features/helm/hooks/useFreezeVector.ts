import { Vector2D } from 'common-types';
import { useRef } from 'react';

const INTERPOLATION_DURATION_MS = 2000;

/**
 * Returns the given Vector2D, but freezes it while isFrozen is true.
 * When isFrozen changes to false, interpolates smoothly from the frozen value to the current value.
 */
export function useFreezeVector(isFrozen: boolean, value: Vector2D): Vector2D {
    const frozenValue = useRef(value);
    const wasFrozen = useRef(false);

    // Track when interpolation started and from what value
    const interpolationStartTime = useRef<number | null>(null);
    const interpolationStartValue = useRef<Vector2D | null>(null);

    // Detect drag start/end transitions
    if (isFrozen && !wasFrozen.current) {
        // Just started dragging - freeze the current value
        frozenValue.current = value;
    } else if (!isFrozen && wasFrozen.current) {
        // Just stopped dragging - start interpolation from frozen value
        interpolationStartTime.current = performance.now();
        interpolationStartValue.current = frozenValue.current;
    } else if (!isFrozen && interpolationStartTime.current === null) {
        // Not dragging and not interpolating - keep frozen value up to date
        frozenValue.current = value;
    }
    wasFrozen.current = isFrozen;

    if (isFrozen) {
        return frozenValue.current;
    }

    // Check if we're interpolating
    if (interpolationStartTime.current !== null && interpolationStartValue.current !== null) {
        const elapsed = performance.now() - interpolationStartTime.current;
        const t = Math.min(elapsed / INTERPOLATION_DURATION_MS, 1);

        if (t >= 1) {
            // Interpolation complete
            interpolationStartTime.current = null;
            interpolationStartValue.current = null;
            return value;
        }

        // Ease-out interpolation for smoother feel
        const eased = 1 - Math.pow(1 - t, 3);

        return {
            x: interpolationStartValue.current.x + (value.x - interpolationStartValue.current.x) * eased,
            y: interpolationStartValue.current.y + (value.y - interpolationStartValue.current.y) * eased,
        };
    }

    return value;
}
