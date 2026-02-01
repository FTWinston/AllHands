import { LocationTargetCardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { calculateFacingAngle } from 'common-data/features/cards/utils/calculateFacingAngle';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { clampAngle, distance, getAnglesBetween, getVectorsBetween, perpendicular, unit } from 'common-data/features/space/utils/vectors';

/**
 * A position with angle, representing a point along the motion path.
 */
export type MotionPathKeyframe = {
    x: number;
    y: number;
    angle: number;
};

/**
 * Calculate the motion path keyframes for a location-targeted card.
 * This is a pure calculation that can be used for both engine motion application
 * and UI path preview.
 *
 * @param currentPosition - The ship's current position and angle
 * @param cardDefinition - The card definition with motion parameters
 * @param targetLocation - The target location to move to
 * @returns Array of keyframes representing the motion path, or null if the move is invalid
 */
export function calculateMotionPath(
    currentPosition: MotionPathKeyframe,
    cardDefinition: LocationTargetCardDefinition,
    targetLocation: Vector2D
): MotionPathKeyframe[] | null {
    let prevKeyframe: MotionPathKeyframe = {
        x: currentPosition.x,
        y: currentPosition.y,
        angle: currentPosition.angle,
    };

    const keyframes: MotionPathKeyframe[] = [prevKeyframe];

    // Calculate start and end angles
    let movementStartAngle = calculateFacingAngle(
        cardDefinition.startFacing,
        prevKeyframe.angle,
        prevKeyframe,
        targetLocation
    );
    if (cardDefinition.startFacingOffset) {
        movementStartAngle += cardDefinition.startFacingOffset;
    }

    let endAngle = calculateFacingAngle(
        cardDefinition.endFacing,
        prevKeyframe.angle,
        prevKeyframe,
        targetLocation
    );
    if (cardDefinition.endFacingOffset) {
        endAngle += cardDefinition.endFacingOffset;
    }

    // If startFacing is specified, add a rotation keyframe before moving.
    if (cardDefinition.startFacing !== undefined && cardDefinition.baseRotationSpeed > 0) {
        const angleDiff = Math.abs(clampAngle(movementStartAngle - prevKeyframe.angle));

        if (angleDiff > 0.001) {
            const rotatedKeyframe: MotionPathKeyframe = {
                x: prevKeyframe.x,
                y: prevKeyframe.y,
                angle: movementStartAngle,
            };

            keyframes.push(rotatedKeyframe);
            prevKeyframe = rotatedKeyframe;
        }
    }

    const totalMoveDistance = distance(targetLocation, prevKeyframe);

    // Ensure that this move respects the limits set in the card data.
    if (cardDefinition.minDistance !== undefined && totalMoveDistance < cardDefinition.minDistance) {
        return null;
    }
    if (cardDefinition.maxDistance !== undefined && totalMoveDistance > cardDefinition.maxDistance) {
        return null;
    }

    if (totalMoveDistance > 0.001 && cardDefinition.baseSpeed > 0) {
        const stepCount = cardDefinition.perpendicularPositionOffsets?.length ?? 0;

        if (stepCount > 0) {
            const intermediateStepAngles = getAnglesBetween(movementStartAngle, endAngle, stepCount);
            const intermediateStepLocations = getVectorsBetween(prevKeyframe, targetLocation, stepCount);

            // Get the unit vector for the direction of movement, then get the perpendicular equivalent.
            const perpendicularUnit = perpendicular(unit(prevKeyframe, targetLocation));

            // Add a keyframe for each intermediate step
            for (let stepIndex = 0; stepIndex < stepCount; stepIndex++) {
                const stepAngle = intermediateStepAngles[stepIndex];
                const stepLocation = intermediateStepLocations[stepIndex];

                // Apply perpendicular offset scaled by total distance
                const offsetDistance = cardDefinition.perpendicularPositionOffsets![stepIndex] * totalMoveDistance;

                const stepKeyframe: MotionPathKeyframe = {
                    x: stepLocation.x + perpendicularUnit.x * offsetDistance,
                    y: stepLocation.y + perpendicularUnit.y * offsetDistance,
                    angle: stepAngle,
                };

                keyframes.push(stepKeyframe);
                prevKeyframe = stepKeyframe;
            }

            // Add the final keyframe at the destination (no offset)
            const endKeyframe: MotionPathKeyframe = {
                x: targetLocation.x,
                y: targetLocation.y,
                angle: endAngle,
            };

            keyframes.push(endKeyframe);
        } else {
            // Straight line movement with no intermediate steps
            const movedKeyframe: MotionPathKeyframe = {
                x: targetLocation.x,
                y: targetLocation.y,
                angle: endAngle,
            };

            keyframes.push(movedKeyframe);
        }
    }

    return keyframes;
}
