import { Vector2D } from '../types/Vector2D';

const tolerance = 0.001;

export function numbersEqual(num1: number, num2: number) {
    return num1 >= num2 - tolerance
        && num1 <= num2 + tolerance;
}

export function vectorsEqual(v1: Vector2D, v2: Vector2D) {
    return numbersEqual(v1.x, v2.x) && numbersEqual(v1.y, v2.y);
}

export function distanceSq(v1: Vector2D, v2: Vector2D) {
    return getMagnitudeSq(v1.x - v2.x, v1.y - v2.y);
}

export function distance(v1: Vector2D, v2: Vector2D) {
    return Math.sqrt(distanceSq(v1, v2));
}

export function unit(v1: Vector2D, v2: Vector2D) {
    const dist = distance(v1, v2);

    if (dist === 0) {
        return { x: 0, y: 0 };
    }

    return {
        x: (v2.x - v1.x) / dist,
        y: (v2.y - v1.y) / dist,
    };
}

export function perpendicular(vector: Vector2D) {
    return {
        x: -vector.y,
        y: vector.x,
    };
}

function getMagnitudeSq(dx: number, dy: number) {
    return dx * dx + dy * dy;
}

function getMagnitude(dx: number, dy: number) {
    return Math.sqrt(getMagnitudeSq(dx, dy));
}

function getAngle(dx: number, dy: number) {
    return -Math.atan2(dy, dx);
}

const factor = Math.PI / 3;
/** Get the closest multiple of Pi / 3 */
export function getClosestOrthogonalAngle(angle: number) {
    return Math.round(angle / factor) * factor;
}

export function determineAngle(fromPos: Vector2D, toPos: Vector2D, valueIfEqual: number = Math.PI) {
    return vectorsEqual(fromPos, toPos)
        ? valueIfEqual
        : getAngle(toPos.x - fromPos.x, toPos.y - fromPos.y);
}

export function clampAngle(angle: number) {
    while (angle <= -Math.PI) {
        angle += Math.PI * 2;
    }

    while (angle > Math.PI) {
        angle -= Math.PI * 2;
    }

    return angle;
}

export function getAnglesBetween(angle1: number, angle2: number, numMidAngles: number) {
    // Normalize the angle difference to take the shortest path around the circle.
    // We preserve direction: if angle2 < angle1, we rotate in the negative direction.
    let diff = angle2 - angle1;

    // Normalize diff to be within (-π, π] to take the shortest path
    while (diff > Math.PI) {
        diff -= Math.PI * 2;
    }
    while (diff <= -Math.PI) {
        diff += Math.PI * 2;
    }

    const angleStep = diff / (numMidAngles + 1);

    return new Array(numMidAngles)
        .fill(0)
        .map((_, i) => {
            return clampAngle(angle1 + angleStep * (i + 1));
        });
}

export function getVectorsBetween(vector1: Vector2D, vector2: Vector2D, numMidVectors: number) {
    const xStep = (vector2.x - vector1.x) / (numMidVectors + 1);
    const yStep = (vector2.y - vector1.y) / (numMidVectors + 1);

    return new Array(numMidVectors)
        .fill(0)
        .map((_, i) => ({
            x: vector1.x + xStep * (i + 1),
            y: vector1.y + yStep * (i + 1),
        }));
}

export function polarToCartesian(angle: number, distance: number) {
    return {
        x: distance * Math.cos(angle),
        y: distance * Math.sin(angle),
    };
}

export function rotatePolar(fromPos: Vector2D, rotateAngle: number) {
    const polarAngle = getAngle(fromPos.x, fromPos.y);
    const distance = getMagnitude(fromPos.x, fromPos.y);
    return polarToCartesian(polarAngle + rotateAngle, distance);
}

export function serializeVector(vector: Vector2D): string {
    return `${vector.x.toFixed(3)},${vector.y.toFixed(3)}`;
}

export function parseVectors(input: string): Vector2D[] {
    const vectors: Vector2D[] = [];
    const entries = input.split(';');

    for (const entry of entries) {
        const parts = entry.split(',', 2);
        if (parts.length !== 2) {
            return [];
        }

        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        vectors.push({ x, y });
    }

    return vectors;
}
