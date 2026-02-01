import { Keyframe, Keyframes, ReadonlyKeyframes } from '../types/Keyframes';
import { Position } from '../types/Position';
import { Vector2D } from '../types/Vector2D';
import { distance } from './vectors';

/** Get the index of the first keyframe whose time is greater than currentTime. */
export function getFirstFutureIndex<T>(keyframes: ReadonlyKeyframes<T>, currentTime: number): number {
    return keyframes.findIndex(keyframe => keyframe.time > currentTime);
}

/** Remove keyframes that are more than 2 frames into the past. Return true if any were removed. */
export function prunePastKeyframes(keyframes: Keyframes<unknown>, currentTime: number): boolean {
    const firstFutureIndex = getFirstFutureIndex(keyframes, currentTime);

    if (firstFutureIndex >= 2) {
        keyframes.splice(0, firstFutureIndex - 2);
        return true;
    }

    return false;
}

/** Remove keyframes that are in the future. Return true if any were removed. */
export function cullFutureKeyframes(keyframes: Keyframes<unknown>, currentTime: number): boolean {
    const firstFutureIndex = getFirstFutureIndex(keyframes, currentTime);

    if (firstFutureIndex !== -1) {
        keyframes.splice(firstFutureIndex);
        return true;
    }

    return false;
}

/** Indicates whether additional frames should be added to properly animate these keyframes. */
export function wantsMoreKeyframes(keyframes: ReadonlyKeyframes<unknown>, currentTime: number): boolean {
    if (keyframes.length < 2) {
        return true;
    }

    // More keyframes are wanted when the penultimate one is past.
    return keyframes[keyframes.length - 2].time <= currentTime;
}

/**
 * Interpolate a single coordinate using Catmull-Rom spline with precomputed t values.
 * The t values should be based on 2D Euclidean distances for consistent curvature.
 */
function resolveCurveValue(
    val0: number,
    val1: number,
    val2: number,
    val3: number,
    t01: number,
    t12: number,
    t23: number,
    fraction: number
): number {
    const m1 = val2 - val1 + t12 * ((val1 - val0) / t01 - (val2 - val0) / (t01 + t12));
    const m2 = val2 - val1 + t12 * ((val3 - val2) / t23 - (val3 - val1) / (t12 + t23));

    const a = 2 * (val1 - val2) + m1 + m2;
    const b = -3 * (val1 - val2) - m1 - m1 - m2;
    const c = m1;

    return resolveNumberValue(a, b, c, val1, fraction);
}

function resolveCurveValueForAngle(
    angle0: number | undefined,
    angle1: number,
    angle2: number,
    angle3: number | undefined,
    t01: number,
    t12: number,
    t23: number,
    fraction: number
) {
    if (angle3 !== undefined) {
        while (angle3 - angle2 > Math.PI) {
            angle3 -= Math.PI * 2;
        }
        while (angle2 - angle3 > Math.PI) {
            angle3 += Math.PI * 2;
        }
    }

    while (angle1 - angle2 > Math.PI) {
        angle1 -= Math.PI * 2;
    }
    while (angle2 - angle1 > Math.PI) {
        angle1 += Math.PI * 2;
    }

    if (angle0 !== undefined) {
        while (angle0 - angle1 > Math.PI) {
            angle0 -= Math.PI * 2;
        }
        while (angle1 - angle0 > Math.PI) {
            angle0 += Math.PI * 2;
        }
    }

    return resolveCurveValue(angle0 ?? angle1, angle1, angle2, angle3 ?? angle2, t01, t12, t23, fraction);
}

function resolveNumberValue(a: number, b: number, c: number, d: number, fraction: number) {
    return a * fraction * fraction * fraction
        + b * fraction * fraction
        + c * fraction
        + d;
}

function getCompletedFraction(startFrame: Keyframe<unknown>, endFrame: Keyframe<unknown>, currentTime: number) {
    const fraction = (currentTime - startFrame.time) / (endFrame.time - startFrame.time);

    return Math.max(0, Math.min(1, fraction));
}

export function interpolateVector(keyframes: ReadonlyKeyframes<Vector2D>, currentTime: number): Vector2D {
    const index2 = getFirstFutureIndex(keyframes, currentTime);

    if (index2 === -1) {
        // If the whole curve is in the past, hold on the last position.
        const last = keyframes[keyframes.length - 1];
        return { x: last.x, y: last.y };
    }

    const frame2 = keyframes[index2];

    if (index2 === 0) {
        // If the whole curve is in the future, hold on the first position.
        return { x: frame2.x, y: frame2.y };
    }

    const frame0 = keyframes[index2 - 2];
    const frame1 = keyframes[index2 - 1];
    const frame3 = keyframes[index2 + 1];

    // Handle edge cases: duplicate first/last points if at boundaries
    const p0: Vector2D = frame0 ?? frame1;
    const p1: Vector2D = frame1;
    const p2: Vector2D = frame2;
    const p3: Vector2D = frame3 ?? frame2;

    // Calculate t values using 2D Euclidean distance (exponent 0.5 = centripetal)
    // Use minimum value to avoid division by zero for coincident points
    const t01 = Math.max(Math.pow(distance(p0, p1), 0.5), 0.00000001);
    const t12 = Math.max(Math.pow(distance(p1, p2), 0.5), 0.00000001);
    const t23 = Math.max(Math.pow(distance(p2, p3), 0.5), 0.00000001);

    const fraction = getCompletedFraction(frame1, frame2, currentTime);

    return {
        x: resolveCurveValue(p0.x, p1.x, p2.x, p3.x, t01, t12, t23, fraction),
        y: resolveCurveValue(p0.y, p1.y, p2.y, p3.y, t01, t12, t23, fraction),
    };
}

export function interpolatePosition(keyframes: ReadonlyKeyframes<Position>, currentTime: number): Position {
    const index2 = getFirstFutureIndex(keyframes, currentTime);

    if (index2 === -1) {
        // If the whole curve is in the past, hold on the last position.
        const last = keyframes[keyframes.length - 1];
        return { x: last.x, y: last.y, angle: last.angle };
    }

    const frame2 = keyframes[index2];

    if (index2 === 0) {
        // If the whole curve is in the future, hold on the first position.
        return { x: frame2.x, y: frame2.y, angle: frame2.angle };
    }

    const frame0 = keyframes[index2 - 2];
    const frame1 = keyframes[index2 - 1];
    const frame3 = keyframes[index2 + 1];

    // Handle edge cases: duplicate first/last points if at boundaries
    const p0: Vector2D = frame0 ?? frame1;
    const p1: Vector2D = frame1;
    const p2: Vector2D = frame2;
    const p3: Vector2D = frame3 ?? frame2;

    // Calculate t values using 2D Euclidean distance (exponent 0.5 = centripetal)
    // Use minimum value to avoid division by zero for coincident points
    const t01 = Math.max(Math.pow(distance(p0, p1), 0.5), 0.00000001);
    const t12 = Math.max(Math.pow(distance(p1, p2), 0.5), 0.00000001);
    const t23 = Math.max(Math.pow(distance(p2, p3), 0.5), 0.00000001);

    const fraction = getCompletedFraction(frame1, frame2, currentTime);

    return {
        x: resolveCurveValue(p0.x, p1.x, p2.x, p3.x, t01, t12, t23, fraction),
        y: resolveCurveValue(p0.y, p1.y, p2.y, p3.y, t01, t12, t23, fraction),
        angle: resolveCurveValueForAngle(frame0?.angle, frame1.angle, frame2.angle, frame3?.angle, t01, t12, t23, fraction),
    };
}
