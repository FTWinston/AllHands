import { Position } from '../../space/types/Position';

/** The evasive maneuver patterns, each of which is the card type that flies it. */
export const evasivePatternTypes = ['patternAlpha', 'patternBeta', 'patternGamma'] as const;

export type EvasivePatternType = typeof evasivePatternTypes[number];

export function isEvasivePattern(cardType: string): cardType is EvasivePatternType {
    return (evasivePatternTypes as readonly string[]).includes(cardType);
}

/** How long every pattern takes to fly, in milliseconds. */
export const evasivePatternDuration = 5_000;

/** How many keyframes each pattern is flown with, not counting the first. Enough that the ship's curves are smooth, however sharp the turn. */
const keyframeCount = 40;

/** A point along a pattern's path, where `time` is how many milliseconds into the pattern it is, and the angle is the ship's own, in the same terms as a `Position`. */
export type PatternKeyframe = Position & { time: number };

/**
 * One pattern, in the ship's own terms: how it's heading at each point of the way, and where it ends up.
 * Forward is the way the ship faces when it starts, and right is to its starboard.
 */
type PatternDefinition = {
    /**
     * The direction the ship travels in (also the way it faces), in radians clockwise of where it started (so, positive is turning right), as `[progress, heading]` pairs.
     * The heading eases from each pair's to the next's, so a pair repeated at a later progress holds a heading, and pairs close together make a sharp turn.
     * Turns are as big as they are written, rather than the shortest way round, so that a pattern can turn through half a circle or more.
     */
    headings: [number, number][];
    /** How fast the ship flies, in units per second. */
    speed: number;
    /** Where the ship ends up, in units forward and to the right of where it started. The path is nudged slightly (at most a few tenths of a unit) so it ends exactly here. */
    end: { forward: number; right: number };
};

const degrees = Math.PI / 180;

const patterns: Record<EvasivePatternType, PatternDefinition> = {
    // A weave: swerve right, cut hard left, then swerve back to the right and straighten up.
    patternAlpha: {
        headings: [
            [0, 0], [0.04, 0],
            [0.16, 60 * degrees], [0.28, 60 * degrees],
            [0.36, -75 * degrees], [0.66, -75 * degrees],
            [0.74, 60 * degrees], [0.84, 60 * degrees],
            [0.97, 0], [1, 0],
        ],
        speed: 1.4,
        end: { forward: 4, right: 0 },
    },
    // A hard break to starboard, jinking back ahead partway round, before finishing the turn to face right.
    patternBeta: {
        headings: [
            [0, 0], [0.08, 0],
            [0.2, 95 * degrees], [0.48, 95 * degrees],
            [0.56, 15 * degrees], [0.7, 15 * degrees],
            [0.8, 90 * degrees], [1, 90 * degrees],
        ],
        speed: 0.9,
        end: { forward: 1.5, right: 3 },
    },
    // A hook round to port: out ahead, then a long turn through half a circle, to come back alongside where it started.
    patternGamma: {
        headings: [
            [0, 0], [0.1, 0],
            [0.9, -180 * degrees], [1, -180 * degrees],
        ],
        speed: 1.2,
        end: { forward: 0, right: -2 },
    },
};

function smootherstep(fraction: number) {
    return fraction * fraction * fraction * (fraction * (fraction * 6 - 15) + 10);
}

function headingAt(headings: PatternDefinition['headings'], progress: number) {
    for (let index = 1; index < headings.length; index++) {
        const [nextProgress, nextHeading] = headings[index];
        if (progress <= nextProgress) {
            const [previousProgress, previousHeading] = headings[index - 1];
            return previousHeading + (nextHeading - previousHeading) * smootherstep((progress - previousProgress) / (nextProgress - previousProgress));
        }
    }

    return headings[headings.length - 1][1];
}

/**
 * The keyframes of the given pattern flown by a ship from the given position (and so, facing). The first is the start, and the last is where it ends up, after `evasivePatternDuration`.
 * This is all that the pattern's path is: the engine flies these keyframes, and the helm's preview of a pattern draws them.
 */
export function calculatePatternPath(pattern: EvasivePatternType, start: Position): PatternKeyframe[] {
    const { headings, speed, end } = patterns[pattern];

    // Work out the path in the ship's own terms, by flying at each heading for each step of the pattern.
    const local = [{ forward: 0, right: 0, heading: 0 }];
    const stepDistance = speed * evasivePatternDuration / 1000 / keyframeCount;
    const substeps = 10;

    for (let step = 1; step <= keyframeCount; step++) {
        let { forward, right } = local[step - 1];

        for (let substep = 0; substep < substeps; substep++) {
            const heading = headingAt(headings, (step - 1 + (substep + 0.5) / substeps) / keyframeCount);
            forward += Math.cos(heading) * stepDistance / substeps;
            right += Math.sin(heading) * stepDistance / substeps;
        }

        local.push({ forward, right, heading: headingAt(headings, step / keyframeCount) });
    }

    // Nudge the path so that it ends exactly where the pattern says, more and more as it goes.
    const missForward = end.forward - local[keyframeCount].forward;
    const missRight = end.right - local[keyframeCount].right;

    // The ship's forward direction, and the direction to its right: ship angles go the opposite way to the angle of a direction on the map.
    const forwardX = Math.cos(start.angle);
    const forwardY = -Math.sin(start.angle);
    const rightX = Math.sin(start.angle);
    const rightY = Math.cos(start.angle);

    return local.map((point, step) => {
        const nudge = smootherstep(step / keyframeCount);
        const forward = point.forward + missForward * nudge;
        const right = point.right + missRight * nudge;

        return {
            time: evasivePatternDuration * step / keyframeCount,
            x: start.x + forwardX * forward + rightX * right,
            y: start.y + forwardY * forward + rightY * right,
            angle: start.angle - point.heading,
        };
    });
}
