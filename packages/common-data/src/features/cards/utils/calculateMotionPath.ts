import { Position } from '../../space/types/Position';
import { Vector2D } from '../../space/types/Vector2D';
import { clampAngle, determineAngle, distance, getAnglesBetween, getTurnBetween, getVectorsBetween, perpendicular, unit } from '../../space/utils/vectors';
import { CardMotionPath, LocationTargetCardDefinition } from '../types/CardDefinition';
import { calculateFacingAngle } from './calculateFacingAngle';

/** A point on a motion path: where the ship is, which way it faces, and when, in milliseconds after the maneuver starts. */
export type MotionPathKeyframe = Position & {
    time: number;
};

export type MotionPathOptions = {
    /** Scales the card's base speed (momentum, for one, speeds some maneuvers up). 1 if not given. */
    speedMultiplier?: number;
    /** Where the hostile ship closest to the ship is when the maneuver starts, if there is one. Only Broadside cares: it turns side-on towards it. */
    hostilePosition?: Vector2D | null;
};

/** A point on the route, with how far the ship has travelled to reach it. The first is where it starts. */
type RoutePoint = Position & {
    travelled: number;
};

type Route = {
    points: RoutePoint[];
    /** The angle to rotate to, in place, before moving, if the route starts by doing that. */
    rotateTo?: number;
};

/** The distance between samples along curved routes, in world units. */
const sampleSpacing = 0.25;

function smoothStep(fraction: number) {
    const x = Math.max(0, Math.min(1, fraction));
    return x * x * (3 - 2 * x);
}

/** An angle, a fraction of the way through a turn of the given size. */
function turned(from: number, turn: number, fraction: number) {
    return clampAngle(from + turn * fraction);
}

/**
 * Calculate where a ship playing a location card will be, and which way it will face, throughout its maneuver.
 * Used by both the engine, to fly the ship, and the helm's path preview, so the two always agree.
 *
 * Positive angles turn left (anticlockwise), and "right" below means the right of the direction of travel.
 *
 * @param start Where the ship is, and which way it faces, when the maneuver starts.
 * @returns The keyframes of the motion, the first being the start, or null if the target is outside the distance limits of the card.
 */
export function calculateMotionPath(
    start: Position,
    cardDefinition: LocationTargetCardDefinition,
    target: Vector2D,
    options: MotionPathOptions = {}
): MotionPathKeyframe[] | null {
    const totalDistance = distance(start, target);

    if (cardDefinition.minDistance !== undefined && totalDistance < cardDefinition.minDistance) {
        return null;
    }
    if (cardDefinition.maxDistance !== undefined && totalDistance > cardDefinition.maxDistance) {
        return null;
    }

    const keyframes: MotionPathKeyframe[] = [{ time: 0, x: start.x, y: start.y, angle: start.angle }];
    const route = planRoute(start, cardDefinition, target, totalDistance, options);

    // TODO: apply helm power (or other ship rotation modifiers) to the rotation speed here.
    let time = 0;
    if (route.rotateTo !== undefined && cardDefinition.baseRotationSpeed > 0) {
        const turn = getTurnBetween(start.angle, route.rotateTo, cardDefinition.turnDirection);

        if (Math.abs(turn) > 0.001) {
            time = (Math.abs(turn) / Math.PI / cardDefinition.baseRotationSpeed) * 4000; // 4 seconds to rotate 180 degrees.

            // When the direction is set, flying the turn as one step could take the short way round instead: do it in stages.
            const stages = cardDefinition.turnDirection ? Math.ceil(Math.abs(turn) / (Math.PI / 2)) : 1;
            for (let stage = 1; stage <= stages; stage++) {
                keyframes.push({
                    time: time * stage / stages,
                    x: start.x,
                    y: start.y,
                    angle: stage === stages ? route.rotateTo : start.angle + turn * stage / stages,
                });
            }
        }
    }

    // TODO: apply helm power (or other ship movement modifiers) to the base speed here.
    const speed = cardDefinition.baseSpeed * (options.speedMultiplier ?? 1);
    if (totalDistance > 0.001 && speed > 0) {
        const moveStart = time;

        for (const point of route.points.slice(1)) {
            keyframes.push({
                time: moveStart + point.travelled / speed * 1000,
                x: point.x,
                y: point.y,
                angle: point.angle,
            });
        }
    }

    return keyframes;
}

function planRoute(
    start: Position,
    cardDefinition: LocationTargetCardDefinition,
    target: Vector2D,
    totalDistance: number,
    options: MotionPathOptions
): Route {
    const path = cardDefinition.path;

    if (path && totalDistance > 0.001) {
        switch (path.shape) {
            case 'sweep':
                return planSweep(start, path, target, totalDistance);
            case 'feint':
                return planFeint(start, path, target);
            case 'broadside':
                return planBroadside(start, target, totalDistance, options.hostilePosition ?? null);
        }
    }

    // Everything else faces the way the card says at each end, turning smoothly between them.
    let startAngle = calculateFacingAngle(cardDefinition.startFacing, start.angle, start, target);
    if (cardDefinition.startFacingOffset) {
        startAngle += cardDefinition.startFacingOffset;
    }

    let endAngle = calculateFacingAngle(cardDefinition.endFacing, start.angle, start, target);
    if (cardDefinition.endFacingOffset) {
        endAngle += cardDefinition.endFacingOffset;
    }

    const rotateTo = cardDefinition.startFacing !== undefined ? startAngle : undefined;

    if (path?.shape === 'zigZag' && totalDistance > 0.001) {
        return { points: planZigZag(start, path, target, totalDistance, startAngle, endAngle, cardDefinition.turnDirection), rotateTo };
    }

    return { points: planStraight(start, cardDefinition, target, totalDistance, startAngle, endAngle), rotateTo };
}

/** A straight line to the target, or a line with fixed lateral offsets at evenly spaced steps along it. */
function planStraight(
    start: Position,
    cardDefinition: LocationTargetCardDefinition,
    target: Vector2D,
    totalDistance: number,
    startAngle: number,
    endAngle: number
): RoutePoint[] {
    const offsets = cardDefinition.perpendicularPositionOffsets ?? [];
    const stepCount = offsets.length;
    const points: RoutePoint[] = [{ x: start.x, y: start.y, angle: startAngle, travelled: 0 }];

    if (stepCount > 0) {
        const stepAngles = getAnglesBetween(startAngle, endAngle, stepCount, cardDefinition.turnDirection);
        const stepLocations = getVectorsBetween(start, target, stepCount);
        const perpendicularUnit = perpendicular(unit(start, target));

        for (let stepIndex = 0; stepIndex < stepCount; stepIndex++) {
            // Offsets are scaled by total distance.
            const offset = offsets[stepIndex] * totalDistance;

            points.push({
                x: stepLocations[stepIndex].x + perpendicularUnit.x * offset,
                y: stepLocations[stepIndex].y + perpendicularUnit.y * offset,
                angle: stepAngles[stepIndex],
                travelled: totalDistance * (stepIndex + 1) / (stepCount + 1),
            });
        }
    }

    points.push({ x: target.x, y: target.y, angle: endAngle, travelled: totalDistance });
    return points;
}

/**
 * A sine of fixed wavelength, swinging from side to side of the line to the target, under an envelope that tapers to nothing at both ends.
 * So the path always starts and ends on the line, however many legs it has, and the number of legs changes smoothly with distance
 * without the path getting any wider.
 */
function planZigZag(
    start: Position,
    path: Extract<CardMotionPath, { shape: 'zigZag' }>,
    target: Vector2D,
    totalDistance: number,
    startAngle: number,
    endAngle: number,
    turnDirection: 'left' | 'right' | undefined
): RoutePoint[] {
    const along = unit(start, target);
    const right = perpendicular(along);
    const taperLength = Math.min(path.legLength, totalDistance / 2);
    const turn = getTurnBetween(startAngle, endAngle, turnDirection);

    // Enough samples to draw each leg smoothly.
    const sampleCount = Math.max(2, Math.ceil(totalDistance / (path.legLength / 4)));
    const points: RoutePoint[] = [{ x: start.x, y: start.y, angle: startAngle, travelled: 0 }];
    let travelled = 0;

    for (let index = 1; index <= sampleCount; index++) {
        const s = totalDistance * index / sampleCount;
        const envelope = smoothStep(Math.min(s, totalDistance - s) / taperLength);

        // The first leg goes left.
        const lateral = index === sampleCount ? 0 : -path.width * envelope * Math.sin(Math.PI * s / path.legLength);
        const previous = points[index - 1];
        const point = {
            x: start.x + along.x * s + right.x * lateral,
            y: start.y + along.y * s + right.y * lateral,
            angle: index === sampleCount ? endAngle : startAngle + turn * s / totalDistance,
            travelled: 0,
        };

        travelled += distance(previous, point);
        point.travelled = travelled;
        points.push(point);
    }

    return points;
}

/**
 * Starts facing to one side of the line to the target and turns the other way, quickly at first then more slowly, until the last stretch is straight.
 * It's built as if the target were wherever that heading profile ends up, then scaled and turned to fit the real target:
 * that keeps the shape the same however far away it is, and leaves the ship facing the way it is going on arrival.
 */
function planSweep(
    start: Position,
    path: Extract<CardMotionPath, { shape: 'sweep' }>,
    target: Vector2D,
    totalDistance: number
): Route {
    const sign = path.turn === 'left' ? 1 : -1;
    const chordAngle = determineAngle(start, target);
    const stepCount = 24;

    // Heading relative to the line to the target, at a fraction of the way along the route: the turn is front-loaded.
    const headingAt = (fraction: number) => {
        const turnProgress = Math.min(1, fraction / path.turnFraction);
        return sign * (-path.startOffset + path.turnAngle * (1 - (1 - turnProgress) ** 2));
    };

    // Integrate the route over a unit length, in terms of along the line and to the right of it.
    const raw = [{ along: 0, right: 0 }];
    for (let step = 0; step < stepCount; step++) {
        const heading = headingAt((step + 0.5) / stepCount);
        const previous = raw[step];
        raw.push({ along: previous.along + Math.cos(heading) / stepCount, right: previous.right - Math.sin(heading) / stepCount });
    }

    // Turn the end of the route (to the left) until it's straight along the line, and scale it to reach the target.
    const end = raw[stepCount];
    const drift = Math.atan2(end.right, end.along);
    const scale = totalDistance / Math.hypot(end.along, end.right);
    const along = unit(start, target);
    const right = perpendicular(along);

    const points = raw.map<RoutePoint>((point, step) => {
        const alongOffset = (point.along * Math.cos(drift) + point.right * Math.sin(drift)) * scale;
        const rightOffset = (-point.along * Math.sin(drift) + point.right * Math.cos(drift)) * scale;

        return {
            x: start.x + along.x * alongOffset + right.x * rightOffset,
            y: start.y + along.y * alongOffset + right.y * rightOffset,
            angle: clampAngle(chordAngle + headingAt(step / stepCount) + drift),
            travelled: step * scale / stepCount,
        };
    });

    // The last point is the target itself, not just very near it.
    points[stepCount].x = target.x;
    points[stepCount].y = target.y;

    return { points, rotateTo: points[0].angle };
}

/** Sets off at an angle to the line to the target, then cuts sharply back towards it, ending facing the way it's going. */
function planFeint(
    start: Position,
    path: Extract<CardMotionPath, { shape: 'feint' }>,
    target: Vector2D
): Route {
    const chordAngle = determineAngle(start, target);

    // Set off to whichever side needs less turn from the current heading. Dead ahead (or behind), it's the left.
    const leftTurn = Math.abs(getTurnBetween(start.angle, chordAngle + path.angle));
    const rightTurn = Math.abs(getTurnBetween(start.angle, chordAngle - path.angle));
    const outAngle = clampAngle(chordAngle + (leftTurn <= rightTurn + 1e-6 ? path.angle : -path.angle));

    const outLength = distance(start, target) * path.legFraction;
    const turningPoint = {
        x: start.x + Math.cos(outAngle) * outLength,
        y: start.y - Math.sin(outAngle) * outLength,
    };
    const backLength = distance(turningPoint, target);
    const backAngle = determineAngle(turningPoint, target);
    const cutTurn = getTurnBetween(outAngle, backAngle);

    // The ship swings round over a short stretch each side of the turning point.
    const blend = Math.min(0.8, outLength, backLength);
    const headingAt = (travelled: number) => {
        return travelled <= outLength - blend / 2 ? outAngle
            : travelled >= outLength + blend / 2 ? backAngle
                : turned(outAngle, cutTurn, smoothStep((travelled - (outLength - blend / 2)) / blend));
    };
    const positionAt = (travelled: number): Vector2D => {
        if (travelled <= outLength) {
            return {
                x: start.x + Math.cos(outAngle) * travelled,
                y: start.y - Math.sin(outAngle) * travelled,
            };
        }
        const fraction = (travelled - outLength) / backLength;
        return {
            x: turningPoint.x + (target.x - turningPoint.x) * fraction,
            y: turningPoint.y + (target.y - turningPoint.y) * fraction,
        };
    };

    // Sample both legs evenly, the turning point included.
    const outSamples = Math.max(1, Math.ceil(outLength / sampleSpacing));
    const backSamples = Math.max(1, Math.ceil(backLength / sampleSpacing));
    const distances = [
        ...Array.from({ length: outSamples + 1 }, (_, index) => outLength * index / outSamples),
        ...Array.from({ length: backSamples }, (_, index) => outLength + backLength * (index + 1) / backSamples),
    ];

    const points = distances.map<RoutePoint>(travelled => ({
        ...positionAt(travelled),
        angle: headingAt(travelled),
        travelled,
    }));
    points[points.length - 1].x = target.x;
    points[points.length - 1].y = target.y;

    return { points, rotateTo: outAngle };
}

/**
 * Straight to the target, without turning first: the ship pivots to be side-on to its direction of travel half way along, then straightens up again.
 * The guns only fire forwards, so it turns towards the closest hostile ship, to sweep them across whatever is to that side of the path.
 * With no hostile ship to go by (or one directly ahead or behind), it turns whichever way is less far from its current heading.
 */
function planBroadside(
    start: Position,
    target: Vector2D,
    totalDistance: number,
    hostilePosition: Vector2D | null
): Route {
    const chordAngle = determineAngle(start, target);
    let sign: 1 | -1 | undefined;

    if (hostilePosition) {
        const bearing = clampAngle(determineAngle(start, hostilePosition) - chordAngle);
        if (Math.abs(bearing) > 0.01 && Math.abs(bearing) < Math.PI - 0.01) {
            sign = bearing > 0 ? 1 : -1;
        }
    }

    if (sign === undefined) {
        const leftTurn = Math.abs(getTurnBetween(start.angle, chordAngle + Math.PI / 2));
        const rightTurn = Math.abs(getTurnBetween(start.angle, chordAngle - Math.PI / 2));
        sign = leftTurn <= rightTurn + 1e-6 ? 1 : -1;
    }

    const sideOn = clampAngle(chordAngle + sign * Math.PI / 2);
    const turnToSide = getTurnBetween(start.angle, sideOn);
    const turnBack = getTurnBetween(sideOn, chordAngle);
    const stepCount = Math.max(8, Math.ceil(totalDistance / (sampleSpacing * 2)));

    const points: RoutePoint[] = [];
    for (let step = 0; step <= stepCount; step++) {
        const fraction = step / stepCount;
        const angle = step === stepCount ? chordAngle
            : fraction < 0.5 ? turned(start.angle, turnToSide, smoothStep(fraction * 2))
                : turned(sideOn, turnBack, smoothStep((fraction - 0.5) * 2));

        points.push({
            x: step === stepCount ? target.x : start.x + (target.x - start.x) * fraction,
            y: step === stepCount ? target.y : start.y + (target.y - start.y) * fraction,
            angle,
            travelled: totalDistance * fraction,
        });
    }

    return { points };
}
