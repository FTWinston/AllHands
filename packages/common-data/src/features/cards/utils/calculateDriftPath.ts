import { Position } from '../../space/types/Position';
import { Vector2D } from '../../space/types/Vector2D';
import { clampAngle, determineAngle } from '../../space/utils/vectors';

/** A point along a drift: where the ship is, and which way it faces, this long after the drift starts. */
export type DriftKeyframe = Position & {
    /** Milliseconds after the drift begins. */
    time: number;
};

/** A ship moving slower than this, in units per second, isn't moving enough to drift. */
export const minDriftSpeed = 0.05;

/** The quickest and slowest a drift can take, in milliseconds, however fast the ship was going. */
const minDriftDuration = 1500;
const maxDriftDuration = 6000;

/** How many keyframes the slowing down is split into, to approximate steady deceleration. */
const driftSteps = 6;

/**
 * Work out the path of a Drift: the ship cuts its engines and slides on the way it was already going, slowing to a stop, while it turns to face a point.
 * Shared by the engine, which flies it, and the helm's preview of it, so that they agree.
 * @param start Where the ship is now, and how it's facing.
 * @param velocity How fast the ship is moving now, in units per second.
 * @param distance How far it slides.
 * @param target The point it turns to face by the time it stops.
 * @returns Keyframes from the start to where the ship stops, or null if it isn't moving or isn't to slide anywhere.
 */
export function calculateDriftPath(start: Position, velocity: Vector2D, distance: number, target: Vector2D): DriftKeyframe[] | null {
    const speed = Math.hypot(velocity.x, velocity.y);
    if (speed < minDriftSpeed || distance <= 0) {
        return null;
    }

    const direction = { x: velocity.x / speed, y: velocity.y / speed };
    const end = { x: start.x + direction.x * distance, y: start.y + direction.y * distance };

    // Steady deceleration from the current speed to nothing covers half the distance that holding that speed would.
    const duration = Math.min(maxDriftDuration, Math.max(minDriftDuration, 2 * distance / speed * 1000));

    // The ship turns the short way round to face the point from where it will stop, keeping its heading if it stops on top of it.
    const endAngle = determineAngle(end, target, start.angle);
    const turn = clampAngle(endAngle - start.angle);

    const keyframes: DriftKeyframe[] = [{ time: 0, x: start.x, y: start.y, angle: start.angle }];
    for (let step = 1; step <= driftSteps; step++) {
        const fraction = step / driftSteps;
        // Slowing steadily: most of the distance is covered early on.
        const progress = 1 - (1 - fraction) * (1 - fraction);
        keyframes.push({
            time: fraction * duration,
            x: start.x + direction.x * distance * progress,
            y: start.y + direction.y * distance * progress,
            angle: start.angle + turn * fraction,
        });
    }

    return keyframes;
}
