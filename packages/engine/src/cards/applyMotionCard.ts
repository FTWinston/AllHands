import { CardMotionSegment, CardMotionSegmentFacing } from 'common-data/features/cards/types/CardDefinition';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { clampAngle, determineAngle, distance, getAnglesBetween, getVectorsBetween, perpendicular, unit } from 'common-data/features/space/utils/vectors';
import { CardCooldownState } from '../state/CardCooldownState';
import { GameState } from '../state/GameState';
import { MotionKeyframe } from '../state/MotionKeyframe';
import { Ship } from '../state/Ship';

/**
 * Calculate an angle based on a CardMotionSegmentFacing value.
 */
function calculateFacingAngle(
    facing: CardMotionSegmentFacing | undefined,
    currentAngle: number,
    prevKeyframe: Vector2D,
    location: Vector2D,
    locations: Vector2D[],
    segmentIndex: number
): number {
    if (facing === CardMotionSegmentFacing.NextVector && segmentIndex + 1 < locations.length) {
        return determineAngle(location, locations[segmentIndex + 1]);
    } else if (facing === CardMotionSegmentFacing.PreviousVector) {
        return determineAngle(prevKeyframe, location);
    } else if (facing === CardMotionSegmentFacing.FinalVector && locations.length >= 1) {
        return determineAngle(prevKeyframe, locations[locations.length - 1]);
    } else {
        // CardMotionSegmentFacing.Current or undefined - keep current angle
        return currentAngle;
    }
}

export function applyMotionCard(
    gameState: GameState,
    ship: Ship,
    cardPower: number,
    motionData: CardMotionSegment[],
    locations: Vector2D[]
): boolean {
    const currentPosition = ship.getPosition(gameState.clock.currentTime);

    let prevKeyframe = new MotionKeyframe(
        gameState.clock.currentTime,
        currentPosition.x,
        currentPosition.y,
        currentPosition.angle
    );

    const keyframes: MotionKeyframe[] = [prevKeyframe];

    for (let i = 0; i < locations.length && i < motionData.length; i++) {
        const dataPoint = motionData[i];
        const location = locations[i];

        // Calculate start and end angles using the same logic for both
        let movementStartAngle = calculateFacingAngle(
            dataPoint.startFacing,
            prevKeyframe.angle,
            prevKeyframe,
            location,
            locations,
            i
        );
        if (dataPoint.startFacingOffset) {
            movementStartAngle += dataPoint.startFacingOffset;
        }

        let endAngle = calculateFacingAngle(
            dataPoint.endFacing,
            prevKeyframe.angle,
            prevKeyframe,
            location,
            locations,
            i
        );
        if (dataPoint.endFacingOffset) {
            endAngle += dataPoint.endFacingOffset;
        }

        // If startFacing is specified, rotate to that angle before moving.
        // If not specified, any rotation to reach endFacing happens during movement.
        if (dataPoint.startFacing !== undefined && dataPoint.baseRotationSpeed > 0) {
            const angleDiff = Math.abs(clampAngle(movementStartAngle - prevKeyframe.angle));

            if (angleDiff > 0.001) {
                // TODO: apply helm power (or other ship rotation modifiers) to the rotation speed here.
                const rotateDuration = (angleDiff / Math.PI / dataPoint.baseRotationSpeed) * 4000; // 4 seconds to rotate 180 degrees.

                const rotatedKeyframe = new MotionKeyframe(
                    prevKeyframe.time + rotateDuration,
                    prevKeyframe.x,
                    prevKeyframe.y,
                    movementStartAngle
                );

                keyframes.push(rotatedKeyframe);
                prevKeyframe = rotatedKeyframe;
            }
        }

        const totalMoveDistance = distance(location, prevKeyframe);

        // Ensure that this move respects the limits set in the card data.
        if (dataPoint.minDistance !== undefined && totalMoveDistance < dataPoint.minDistance) {
            return false;
        }
        if (dataPoint.maxDistance !== undefined && totalMoveDistance > dataPoint.maxDistance) {
            return false;
        }

        if (totalMoveDistance > 0.001 && dataPoint.baseSpeed > 0) {
            const stepCount = dataPoint.perpendicularPositionOffsets?.length ?? 0;

            if (stepCount > 0) {
                const intermediateStepAngles = getAnglesBetween(movementStartAngle, endAngle, stepCount);
                const intermediateStepLocations = getVectorsBetween(prevKeyframe, location, stepCount);

                // Get the unit vector for the direction of movement, then get the perpendicular equivalent.
                const perpendicularUnit = perpendicular(unit(prevKeyframe, location));

                // TODO: apply helm power (or other ship movement modifiers) to the base speed here.
                const stepMoveDuration = totalMoveDistance / (stepCount + 1) / dataPoint.baseSpeed * 1000;

                // Add a keyframe for each intermediate step
                for (let stepIndex = 0; stepIndex < stepCount; stepIndex++) {
                    const stepAngle = intermediateStepAngles[stepIndex];
                    const stepLocation = intermediateStepLocations[stepIndex];

                    // Apply perpendicular offset scaled by total distance
                    const offsetDistance = dataPoint.perpendicularPositionOffsets![stepIndex] * totalMoveDistance;

                    const stepKeyframe = new MotionKeyframe(
                        prevKeyframe.time + stepMoveDuration,
                        stepLocation.x + perpendicularUnit.x * offsetDistance,
                        stepLocation.y + perpendicularUnit.y * offsetDistance,
                        stepAngle
                    );

                    keyframes.push(stepKeyframe);
                    prevKeyframe = stepKeyframe;
                }

                // Add the final keyframe at the destination (no offset)
                const endKeyframe = new MotionKeyframe(
                    prevKeyframe.time + stepMoveDuration,
                    location.x,
                    location.y,
                    endAngle
                );

                keyframes.push(endKeyframe);
                prevKeyframe = endKeyframe;
            } else {
                // Straight line movement with no intermediate steps
                // TODO: apply helm power (or other ship movement modifiers) to the base speed here.
                const moveDuration = (totalMoveDistance / dataPoint.baseSpeed) * 1000;

                const movedKeyframe = new MotionKeyframe(
                    prevKeyframe.time + moveDuration,
                    location.x,
                    location.y,
                    endAngle
                );

                keyframes.push(movedKeyframe);
                prevKeyframe = movedKeyframe;
            }
        }
    }

    ship.setMotion(...keyframes);

    // Record this maneuver on the ship's helm, so it can be cancelled if the helm doesn't maintain sufficient power.
    ship.helmState.activeManeuver.clear();
    ship.helmState.activeManeuver.push(new CardCooldownState(
        gameState.clock.currentTime,
        prevKeyframe.time,
        cardPower
    ));

    return true;
}
