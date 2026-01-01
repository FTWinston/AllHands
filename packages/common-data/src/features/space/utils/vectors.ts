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

    return {
        x: (v2.x - v1.x) / dist,
        y: (v2.y - v1.y) / dist,
    };
}

function getMagnitudeSq(dx: number, dy: number) {
    return dx * dx + dy * dy;
}

function getMagnitude(dx: number, dy: number) {
    return Math.sqrt(getMagnitudeSq(dx, dy));
}

function getAngle(dx: number, dy: number) {
    return Math.atan2(dy, dx);
}

const factor = Math.PI / 3;
/** Get the closest multiple of Pi / 3 */
export function getClosestOrthogonalAngle(angle: number) {
    return Math.round(angle / factor) * factor;
}

export function determineAngle(fromPos: Vector2D, toPos: Vector2D, valueIfEqual: number) {
    return vectorsEqual(fromPos, toPos)
        ? valueIfEqual
        : getAngle(toPos.x - fromPos.x, toPos.y - fromPos.y);
}

export function determineMidAngle(fromPos: Vector2D, midPos: Vector2D, endPos: Vector2D, valueIfEqual: number) {
    const firstAngle = determineAngle(fromPos, midPos, valueIfEqual);
    const secondAngle = determineAngle(midPos, endPos, valueIfEqual);
    return getMidAngle(firstAngle, secondAngle);
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

function getMidAngle(angle1: number, angle2: number) {
    if (angle2 < angle1) {
        [angle1, angle2] = [angle2, angle1];
    }

    if (angle2 - angle1 > Math.PI) {
        angle1 += Math.PI * 2;
    }

    let midAngle = (angle1 + angle2) / 2;

    return clampAngle(midAngle);
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
