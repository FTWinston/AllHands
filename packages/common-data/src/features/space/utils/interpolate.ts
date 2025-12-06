import { Keyframe, Keyframes } from '../types/Keyframes';
import { Position } from '../types/Position';
import { Vector2D } from '../types/Vector2D';

/** Get the index of the first keyframe whose time is greater than currentTime. */
export function getFirstFutureIndex<T>(keyframes: Keyframes<T>, currentTime: number): number {
    return keyframes.findIndex(keyframe => keyframe.time > currentTime);
}

/** Remove keyframes that are more than 2 frames into the past. Return true if any were removed. */
export function pruneKeyframes(keyframes: Keyframes<unknown>, currentTime: number): boolean {
    const firstFutureIndex = getFirstFutureIndex(keyframes, currentTime);

    if (firstFutureIndex >= 2) {
        keyframes.splice(0, firstFutureIndex - 2);
        return true;
    }

    return false;
}

/** Indicates whether additional frames should be added to properly animate these keyframes. */
export function wantsMoreKeyframes(keyframes: Keyframes<unknown>, currentTime: number): boolean {
    if (keyframes.length < 2) {
        return true;
    }

    // More keyframes are wanted when the penultimate one is past.
    return keyframes[keyframes.length - 2].time <= currentTime;
}

/** Get a non-zero distance between two keypoints. Don't let the distance between two values ever actually be zero, or we get divide by zero errors. */
function distance(from: number, to: number) {
    let distance = Math.abs(to - from);
    return Math.max(distance, 0.00000001);
}

function resolveCurveValue(val0: number | undefined, val1: number, val2: number, val3: number | undefined, fraction: number): number {
    if (val0 === undefined) {
        val0 = val1;
    }

    if (val3 === undefined) {
        val3 = val2;
    }

    // Exponent of 0.5 makes this a centripetal Catmull-Rom spline.
    const t01 = Math.pow(distance(val0, val1), 0.5);
    const t12 = Math.pow(distance(val1, val2), 0.5);
    const t23 = Math.pow(distance(val2, val3), 0.5);

    const m1 = val2 - val1 + t12 * ((val1 - val0) / t01 - (val2 - val0) / (t01 + t12));
    const m2 = val2 - val1 + t12 * ((val3 - val2) / t23 - (val3 - val1) / (t12 + t23));

    const a = 2 * (val1 - val2) + m1 + m2;
    const b = -3 * (val1 - val2) - m1 - m1 - m2;
    const c = m1;

    return resolveNumberValue(a, b, c, val1, fraction);
}

function resolveCurveValueForAngle(angle0: number | undefined, angle1: number, angle2: number, angle3: number | undefined, fraction: number) {
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

    return resolveCurveValue(angle0, angle1, angle2, angle3, fraction);
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

type KeyCurveResolution<T> = ReadonlyArray<[keyof T, typeof resolveCurveValue]>;

function interpolateObjectKeys<T extends object>(keyframes: Keyframes<T>, currentTime: number, fieldResolution: KeyCurveResolution<T>): T {
    const index2 = getFirstFutureIndex(keyframes, currentTime);

    if (index2 === -1) {
        // If the whole curve is in the past, hold on the last position.
        return keyframes[keyframes.length - 1] as T;
    }

    const frame2 = keyframes[index2];

    if (index2 === 0) {
        // If the whole curve is in the future, hold on the first position.
        return frame2 as T;
    }

    const frame0 = keyframes[index2 - 2];
    const frame1 = keyframes[index2 - 1];
    const frame3 = keyframes[index2 + 1];

    const val0 = (frame0 ?? {}) as Record<keyof T, number>;
    const val1 = frame1 as Record<keyof T, number>;
    const val2 = frame2 as Record<keyof T, number>;
    const val3 = (frame3 ?? {}) as Record<keyof T, number>;

    const fraction = getCompletedFraction(frame1, frame2, currentTime);
    const result = {} as Record<keyof T, number>;

    for (const [keyName, resolveValue] of fieldResolution) {
        const key = keyName as keyof T;
        result[key] = resolveValue(val0[key], val1[key], val2[key], val3[key], fraction);
    }

    return result as T;
}

const vectorKeys = Object.entries({
    x: resolveCurveValue,
    y: resolveCurveValue,
}) as KeyCurveResolution<Vector2D>;

export function interpolateVector(keyframes: Keyframes<Vector2D>, currentTime: number): Vector2D {
    return interpolateObjectKeys<Vector2D>(keyframes, currentTime, vectorKeys);
}

const positionKeys = Object.entries({
    x: resolveCurveValue,
    y: resolveCurveValue,
    angle: resolveCurveValueForAngle,
}) as KeyCurveResolution<Position>;

export function interpolatePosition(keyframes: Keyframes<Position>, currentTime: number): Position {
    return interpolateObjectKeys<Position>(keyframes, currentTime, positionKeys);
}
