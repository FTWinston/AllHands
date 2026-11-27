import { Position } from '../../space/types/Position';
import { Vector2D } from '../../space/types/Vector2D';
import { clampAngle } from '../../space/utils/vectors';

/** A point along a Hairpin or a Juke: where the ship is, and which way it faces, this many milliseconds after the maneuver starts. */
export type MomentumManeuverKeyframe = Position & { time: number };

/** Which way, as the ship faces, it turns or steps: left is to port (anticlockwise), right is to starboard (clockwise). */
export type ManeuverSide = 'left' | 'right';

/** How tight a Hairpin's turn is, in units. */
export const hairpinRadius = 2;

/** How fast a Hairpin flies, in units per second, before the ship's own maneuver speed is applied. */
export const hairpinSpeed = 2;

/** How many keyframes a Hairpin's turn is flown with, so it's a smooth curve. */
const hairpinTurnSteps = 12;

/** How long a Juke takes, in milliseconds. */
export const jukeDuration = 600;

/** How far a Juke yaws towards the side it steps to, partway through, in radians. */
const jukeYaw = 0.3;

/**
 * The side of a ship, as it faces, that's away from a point: right if the point is to its left, and left if it's to its right.
 * Starboard if there's no point, or it's dead ahead or behind.
 */
export function getSideAwayFrom(start: Position, point: Vector2D | null | undefined): ManeuverSide {
    if (!point) {
        return 'right';
    }

    // A ship points along (cos, -sin) of its angle, so its left is along (-sin, -cos).
    const leftness = (point.x - start.x) * -Math.sin(start.angle) + (point.y - start.y) * -Math.cos(start.angle);
    return leftness < 0 ? 'left' : 'right';
}

/**
 * Work out the path of a Hairpin: the ship turns through half a circle to the given side, then flies the given distance back the way it was facing.
 * Shared by the engine, which flies it, and the helm's preview of it, so that they agree.
 * @param start Where the ship is now, and how it's facing.
 * @param side Which way it turns.
 * @param distance How far it flies back once it's turned round.
 * @param speed How fast it flies, in units per second.
 */
export function calculateHairpinPath(start: Position, side: ManeuverSide, distance: number, speed: number): MomentumManeuverKeyframe[] {
    const sign = side === 'left' ? 1 : -1;
    const facing = start.angle;

    // The middle of the turn is off to the side the ship turns to.
    const centerX = start.x + sign * hairpinRadius * -Math.sin(facing);
    const centerY = start.y + sign * hairpinRadius * -Math.cos(facing);
    const turnTime = Math.PI * hairpinRadius / speed * 1000;

    const keyframes: MomentumManeuverKeyframe[] = [];
    for (let step = 0; step <= hairpinTurnSteps; step++) {
        const fraction = step / hairpinTurnSteps;
        const heading = facing + sign * Math.PI * fraction;
        keyframes.push({
            time: turnTime * fraction,
            x: centerX + sign * hairpinRadius * Math.sin(heading),
            y: centerY + sign * hairpinRadius * Math.cos(heading),
            angle: clampAngle(heading),
        });
    }

    if (distance > 0) {
        // Back the way it came: the opposite of the way it was facing, which is along (-cos, sin) of its angle.
        const turned = keyframes[keyframes.length - 1];
        keyframes.push({
            time: turned.time + distance / speed * 1000,
            x: turned.x - Math.cos(facing) * distance,
            y: turned.y + Math.sin(facing) * distance,
            angle: turned.angle,
        });
    }

    return keyframes;
}

/**
 * Work out the path of a Juke: a sharp sidestep of the given distance to the given side, mostly done in the first half, yawing towards it and back.
 * The ship ends facing the way it started. Shared by the engine, which flies it, and the helm's preview of it, so that they agree.
 */
export function calculateJukePath(start: Position, side: ManeuverSide, distance: number): MomentumManeuverKeyframe[] {
    const sign = side === 'left' ? 1 : -1;
    const stepX = sign * -Math.sin(start.angle) * distance;
    const stepY = sign * -Math.cos(start.angle) * distance;

    return [
        { time: 0, x: start.x, y: start.y, angle: start.angle },
        { time: jukeDuration * 0.4, x: start.x + stepX * 0.75, y: start.y + stepY * 0.75, angle: clampAngle(start.angle + sign * jukeYaw) },
        { time: jukeDuration, x: start.x + stepX, y: start.y + stepY, angle: start.angle },
    ];
}
