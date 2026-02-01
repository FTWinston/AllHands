import { CardMotionSegmentFacing, LocationTargetCardDefinition } from 'common-data/features/cards/types/CardDefinition';
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
    location: Vector2D
): number {
    if (facing === CardMotionSegmentFacing.NextVector || facing === CardMotionSegmentFacing.FinalVector) {
        return determineAngle(prevKeyframe, location);
    } else if (facing === CardMotionSegmentFacing.PreviousVector) {
        return determineAngle(location, prevKeyframe);
    } else {
        // CardMotionSegmentFacing.Current or undefined - keep current angle
        return currentAngle;
    }
}

export function applyMotionCard(
    gameState: GameState,
    ship: Ship,
    cardPower: number,
    cardDefinition: LocationTargetCardDefinition,
    location: Vector2D
): boolean {
    const currentPosition = ship.getPosition(gameState.clock.currentTime);

    let prevKeyframe = new MotionKeyframe(
        gameState.clock.currentTime,
        currentPosition.x,
        currentPosition.y,
        currentPosition.angle
    );

    const keyframes: MotionKeyframe[] = [prevKeyframe];

    // Calculate start and end angles
    let movementStartAngle = calculateFacingAngle(
        cardDefinition.startFacing,
        prevKeyframe.angle,
        prevKeyframe,
        location
    );
    if (cardDefinition.startFacingOffset) {
        movementStartAngle += cardDefinition.startFacingOffset;
    }

    let endAngle = calculateFacingAngle(
        cardDefinition.endFacing,
        prevKeyframe.angle,
        prevKeyframe,
        location
    );
    if (cardDefinition.endFacingOffset) {
        endAngle += cardDefinition.endFacingOffset;
    }

    // If startFacing is specified, rotate to that angle before moving.
    // If not specified, any rotation to reach endFacing happens during movement.
    if (cardDefinition.startFacing !== undefined && cardDefinition.baseRotationSpeed > 0) {
        const angleDiff = Math.abs(clampAngle(movementStartAngle - prevKeyframe.angle));

        if (angleDiff > 0.001) {
            // TODO: apply helm power (or other ship rotation modifiers) to the rotation speed here.
            const rotateDuration = (angleDiff / Math.PI / cardDefinition.baseRotationSpeed) * 4000; // 4 seconds to rotate 180 degrees.

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
    if (cardDefinition.minDistance !== undefined && totalMoveDistance < cardDefinition.minDistance) {
        return false;
    }
    if (cardDefinition.maxDistance !== undefined && totalMoveDistance > cardDefinition.maxDistance) {
        return false;
    }

    if (totalMoveDistance > 0.001 && cardDefinition.baseSpeed > 0) {
        const stepCount = cardDefinition.perpendicularPositionOffsets?.length ?? 0;

        if (stepCount > 0) {
            const intermediateStepAngles = getAnglesBetween(movementStartAngle, endAngle, stepCount);
            const intermediateStepLocations = getVectorsBetween(prevKeyframe, location, stepCount);

            // Get the unit vector for the direction of movement, then get the perpendicular equivalent.
            const perpendicularUnit = perpendicular(unit(prevKeyframe, location));

            // TODO: apply helm power (or other ship movement modifiers) to the base speed here.
            const stepMoveDuration = totalMoveDistance / (stepCount + 1) / cardDefinition.baseSpeed * 1000;

            // Add a keyframe for each intermediate step
            for (let stepIndex = 0; stepIndex < stepCount; stepIndex++) {
                const stepAngle = intermediateStepAngles[stepIndex];
                const stepLocation = intermediateStepLocations[stepIndex];

                // Apply perpendicular offset scaled by total distance
                const offsetDistance = cardDefinition.perpendicularPositionOffsets![stepIndex] * totalMoveDistance;

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
            const moveDuration = (totalMoveDistance / cardDefinition.baseSpeed) * 1000;

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
