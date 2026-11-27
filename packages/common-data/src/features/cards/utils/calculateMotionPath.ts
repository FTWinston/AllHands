import { Position } from '../../space/types/Position';
import { Vector2D } from '../../space/types/Vector2D';
import { clampAngle, determineAngle, distance, getTurnBetween, perpendicular, unit } from '../../space/utils/vectors';
import { CardMotionPath, LocationTargetCardDefinition } from '../types/CardDefinition';
import { calculateFacingAngle } from './calculateFacingAngle';

/** A point on a motion path: where the ship is, which way it faces, and when, in milliseconds after the maneuver starts. */
export type MotionPathKeyframe = Position & {
    time: number;
};

export type MotionPathOptions = {
    /** Scales the card's base speed (momentum, for one, speeds some maneuvers up). 1 if not given. */
    speedMultiplier?: number;
    /** Where the hostile ship closest to the ship is when the maneuver starts, if there is one. Broadside turns side-on towards it, and Slingshot swings round it. */
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

/** The angle between samples round the arcs of a route, in radians. */
const arcSampleAngle = Math.PI / 18;

/** How far a ship that leaves some of its first turn to do while moving takes to finish it, in world units (or half the route, if that's shorter). */
const turnWhileMovingDistance = 1.5;

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
    if (cardDefinition.maxBearing !== undefined && totalDistance > 0.001
        && Math.abs(clampAngle(determineAngle(start, target) - start.angle)) > cardDefinition.maxBearing + 1e-6) {
        return null;
    }

    const keyframes: MotionPathKeyframe[] = [{ time: 0, x: start.x, y: start.y, angle: start.angle }];
    const route = planRoute(start, cardDefinition, target, totalDistance, options);
    if (!route) {
        return null;
    }

    // Some of the turn before moving can be left to do on the move: the ship turns on the spot for the rest, then finishes the turn over the start of the route.
    if (route.rotateTo !== undefined && cardDefinition.turnWhileMoving) {
        const fullTurn = getTurnBetween(start.angle, route.rotateTo, cardDefinition.turnDirection);
        const leftOver = Math.sign(fullTurn) * Math.min(Math.abs(fullTurn), cardDefinition.turnWhileMoving);
        const routeLength = route.points[route.points.length - 1].travelled;
        const blendDistance = Math.min(turnWhileMovingDistance, routeLength / 2);

        if (Math.abs(leftOver) > 0.001 && blendDistance > 0.001) {
            // Make sure there's a point where the turn is finished, so it isn't spread over the whole of a long straight leg.
            const after = route.points.findIndex(point => point.travelled >= blendDistance);
            if (after > 0 && route.points[after].travelled > blendDistance + 1e-6) {
                const before = route.points[after - 1];
                const next = route.points[after];
                const fraction = (blendDistance - before.travelled) / (next.travelled - before.travelled);
                route.points.splice(after, 0, {
                    x: before.x + (next.x - before.x) * fraction,
                    y: before.y + (next.y - before.y) * fraction,
                    angle: turned(before.angle, getTurnBetween(before.angle, next.angle), fraction),
                    travelled: blendDistance,
                });
            }

            route.rotateTo = clampAngle(route.rotateTo - leftOver);
            route.points = route.points.map(point => point.travelled >= blendDistance
                ? point
                : { ...point, angle: clampAngle(point.angle - leftOver * (1 - smoothStep(point.travelled / blendDistance))) });
        }
    }

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
): Route | null {
    const path = cardDefinition.path;

    if (path && totalDistance > 0.001) {
        switch (path.shape) {
            case 'sweep':
                return planSweep(start, path, target, totalDistance);
            case 'sharpTurn':
                return planSharpTurn(start, path, target);
            case 'slingshot':
                return options.hostilePosition ? planSlingshot(start, path, target, options.hostilePosition) : null;
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

    return { points: planStraight(start, target, totalDistance, startAngle, endAngle), rotateTo };
}

/** A straight line to the target. */
function planStraight(start: Position, target: Vector2D, totalDistance: number, startAngle: number, endAngle: number): RoutePoint[] {
    return [
        { x: start.x, y: start.y, angle: startAngle, travelled: 0 },
        { x: target.x, y: target.y, angle: endAngle, travelled: totalDistance },
    ];
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

/** The point on a circle at which a ship flying round it is heading the given way, going round to the left (sign 1) or right (sign -1). */
function onArc(center: Vector2D, radius: number, sign: number, heading: number): Vector2D {
    // A ship faces along (cos, -sin) of its angle, so the centre of a circle it's turning round is off to that side of it.
    return { x: center.x + sign * radius * Math.sin(heading), y: center.y + sign * radius * Math.cos(heading) };
}

/**
 * Where a ship flying round a circle, to the left (sign 1) or right (sign -1), meets a straight line through the given point:
 * either joining the circle from a line that comes from the point ('in'), or leaving it on a line that goes to the point ('out').
 * Returns the heading there, or null if the point is inside the circle.
 */
function tangentHeading(center: Vector2D, radius: number, sign: number, point: Vector2D, way: 'in' | 'out'): number | null {
    const range = distance(center, point);
    if (range <= radius + 1e-6) {
        return null;
    }

    const toPoint = unit(center, point);
    const spread = Math.acos(radius / range);

    for (const side of [1, -1]) {
        const cos = Math.cos(side * spread);
        const sin = Math.sin(side * spread);
        const touch = { x: center.x + radius * (toPoint.x * cos - toPoint.y * sin), y: center.y + radius * (toPoint.x * sin + toPoint.y * cos) };

        // The heading of a ship at that point on the circle, going round the given way (see `onArc`), and whether that's along the line to (or from) the point.
        const heading = Math.atan2((touch.x - center.x) * sign, (touch.y - center.y) * sign);
        const lineHeading = way === 'in' ? determineAngle(point, touch) : determineAngle(touch, point);
        if (Math.abs(clampAngle(lineHeading - heading)) < 0.01) {
            return heading;
        }
    }

    return null;
}

/** Adds a point to a route, working out how far along it is from the last one. */
function addPoint(points: RoutePoint[], position: Vector2D, angle: number) {
    const previous = points[points.length - 1];
    points.push({ x: position.x, y: position.y, angle, travelled: previous.travelled + distance(previous, position) });
}

/** Adds points to a route round a circle to the left (sign 1) or right (sign -1), from one heading until it heads the other way, facing the way it goes. */
function addArc(points: RoutePoint[], center: Vector2D, radius: number, sign: number, fromHeading: number, toHeading: number) {
    const sweep = ((sign * (toHeading - fromHeading)) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const steps = Math.max(1, Math.ceil(sweep / arcSampleAngle));

    for (let step = 1; step <= steps; step++) {
        const heading = fromHeading + sign * sweep * step / steps;
        addPoint(points, onArc(center, radius, sign, heading), clampAngle(heading));
    }
}

/**
 * Flies straight on the way the ship faces, without turning first, for the lead distance, then turns hard onto the target and flies straight to it.
 * It turns towards whichever side the target is on. A target too close to the turn for its radius is turned to more tightly.
 */
function planSharpTurn(
    start: Position,
    path: Extract<CardMotionPath, { shape: 'sharpTurn' }>,
    target: Vector2D
): Route {
    const heading = start.angle;
    const turnPoint = { x: start.x + Math.cos(heading) * path.lead, y: start.y - Math.sin(heading) * path.lead };
    const points: RoutePoint[] = [{ x: start.x, y: start.y, angle: heading, travelled: 0 }];
    addPoint(points, turnPoint, heading);

    // Turn towards the side of the ship the target is on. Its left is along (-sin, -cos) of its angle.
    const leftness = (target.x - turnPoint.x) * -Math.sin(heading) + (target.y - turnPoint.y) * -Math.cos(heading);
    const sign = leftness >= 0 ? 1 : -1;

    for (let radius = path.radius; radius > 0.05; radius /= 2) {
        const center = { x: turnPoint.x + sign * radius * -Math.sin(heading), y: turnPoint.y + sign * radius * -Math.cos(heading) };
        const outHeading = tangentHeading(center, radius, sign, target, 'out');
        if (outHeading !== null) {
            addArc(points, center, radius, sign, heading, outHeading);
            addPoint(points, target, outHeading);
            return { points };
        }
    }

    // The target is right by the turning point: just go there.
    addPoint(points, target, determineAngle(turnPoint, target, heading));
    return { points };
}

/**
 * Flies at the closest hostile ship, round its far side, and out to the target, facing the way it goes throughout.
 * It goes round whichever way turns it towards the target, so the hostile ship is passed on the other side.
 * It swings round more tightly if the ship or the target are too close to the hostile ship for the radius, and can't be flown if they're right by it.
 */
function planSlingshot(
    start: Position,
    path: Extract<CardMotionPath, { shape: 'slingshot' }>,
    target: Vector2D,
    hostile: Vector2D
): Route | null {
    const radius = Math.min(path.radius, 0.6 * distance(start, hostile), 0.6 * distance(target, hostile));
    if (radius < 0.5) {
        return null;
    }

    const turn = clampAngle(determineAngle(hostile, target) - determineAngle(start, hostile));
    const sign = turn >= 0 ? 1 : -1;
    const inHeading = tangentHeading(hostile, radius, sign, start, 'in');
    const outHeading = tangentHeading(hostile, radius, sign, target, 'out');
    if (inHeading === null || outHeading === null) {
        return null;
    }

    const points: RoutePoint[] = [{ x: start.x, y: start.y, angle: inHeading, travelled: 0 }];
    addPoint(points, onArc(hostile, radius, sign, inHeading), inHeading);
    addArc(points, hostile, radius, sign, inHeading, outHeading);
    addPoint(points, target, outHeading);

    return { points, rotateTo: inHeading };
}

/**
 * Straight to the target, having turned to face it first: the ship pivots to be side-on to its direction of travel half way along, then straightens up again.
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
    const turnToSide = getTurnBetween(chordAngle, sideOn);
    const turnBack = getTurnBetween(sideOn, chordAngle);
    const stepCount = Math.max(8, Math.ceil(totalDistance / (sampleSpacing * 2)));

    const points: RoutePoint[] = [];
    for (let step = 0; step <= stepCount; step++) {
        const fraction = step / stepCount;
        const angle = step === stepCount ? chordAngle
            : fraction < 0.5 ? turned(chordAngle, turnToSide, smoothStep(fraction * 2))
                : turned(sideOn, turnBack, smoothStep((fraction - 0.5) * 2));

        points.push({
            x: step === stepCount ? target.x : start.x + (target.x - start.x) * fraction,
            y: step === stepCount ? target.y : start.y + (target.y - start.y) * fraction,
            angle,
            travelled: totalDistance * fraction,
        });
    }

    return { points, rotateTo: chordAngle };
}
