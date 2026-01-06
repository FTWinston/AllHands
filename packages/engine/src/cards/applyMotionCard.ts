import { CardMotionSegment, CardMotionSegmentFacing, CardMotionSegmentRotationBehavior } from 'common-data/features/cards/types/CardDefinition';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { clampAngle, determineAngle, distance, getAnglesBetween, getVectorsBetween, perpendicular, unit } from 'common-data/features/space/utils/vectors';
import { GameState } from '../state/GameState';
import { MotionKeyframe } from '../state/MotionKeyframe';
import { Ship } from '../state/Ship';

export function applyMotionCard(
    gameState: GameState,
    ship: Ship,
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

        let startAngle = prevKeyframe.angle;
        let endAngle: number;

        if (dataPoint.endFacing === CardMotionSegmentFacing.NextVector && i + 1 < locations.length) {
            const nextVector = locations[i + 1];
            endAngle = determineAngle(location, nextVector);
        } else if (dataPoint.endFacing === CardMotionSegmentFacing.PreviousVector && i - 1 >= 0) {
            endAngle = determineAngle(prevKeyframe, location);
        } else if (dataPoint.endFacing === CardMotionSegmentFacing.FinalVector && locations.length >= 1) {
            const finalVector = locations[locations.length - 1];
            endAngle = determineAngle(prevKeyframe, finalVector);
        } else {
            endAngle = prevKeyframe.angle;
        }
        if (dataPoint.endFacingOffset) {
            endAngle += dataPoint.endFacingOffset;
        }

        // Rotate (if needed and if separate from moving), then move.
        if (dataPoint.behavior === CardMotionSegmentRotationBehavior.RotateSeparateFromMoving && dataPoint.baseRotationSpeed > 0) {
            const angleDiff = Math.abs(clampAngle(endAngle - startAngle));

            if (angleDiff > 0.001) {
                // TODO: apply helm power (or other ship rotation modifiers) to the rotation speed here.
                const rotateDuration = (angleDiff / Math.PI / dataPoint.baseRotationSpeed) * 4000; // 4 seconds to rotate 180 degrees.

                const rotatedKeyframe = new MotionKeyframe(
                    prevKeyframe.time + rotateDuration,
                    prevKeyframe.x,
                    prevKeyframe.y,
                    endAngle
                );

                keyframes.push(rotatedKeyframe);
                prevKeyframe = rotatedKeyframe;

                // If we have rotated, and the movement has perpendicular offsets, each offset step should use the same angle.
                // If we have not rotated, and will instead be rotating while moving, each offset step will be at a different angle.
                startAngle = endAngle;
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
            if (dataPoint.perpendicularPositionOffsets?.length) {
                const intermediateStepAngles = getAnglesBetween(startAngle, endAngle, dataPoint.perpendicularPositionOffsets.length);
                const intermediateStepLocations = getVectorsBetween(prevKeyframe, location, dataPoint.perpendicularPositionOffsets.length);

                // TODO: apply helm power (or other ship movement modifiers) to the base speed here.
                const stepMoveDuration = (totalMoveDistance / dataPoint.baseSpeed) * 1000;

                // Add a keyframe for each perpendincular offset step in turn.
                for (let stepIndex = 0; stepIndex <= dataPoint.perpendicularPositionOffsets.length; stepIndex++) {
                    const stepAngle = intermediateStepAngles[stepIndex];
                    const stepLocation = intermediateStepLocations[stepIndex];

                    // Each step keyframe should have its perpendicular offset applied, scaled to fit the total move distance.
                    const stepPerpendincularOffsetDistance = dataPoint.perpendicularPositionOffsets[stepIndex] * totalMoveDistance;

                    // Get the unit vector for the direction of movement, then get the perpendicular equivalent.
                    const perpendicularUnit = perpendicular(unit(prevKeyframe, stepLocation));

                    // Add the scaled perpendicular offset to the step location.
                    const stepKeyframe = new MotionKeyframe(
                        prevKeyframe.time + stepMoveDuration,
                        stepLocation.x + perpendicularUnit.x * stepPerpendincularOffsetDistance,
                        stepLocation.y + perpendicularUnit.y * stepPerpendincularOffsetDistance,
                        stepAngle
                    );

                    keyframes.push(stepKeyframe);
                    prevKeyframe = stepKeyframe;
                }

                // Also add a keyframe for the end step, which never has an offset.
                const endKeyframe = new MotionKeyframe(
                    prevKeyframe.time + stepMoveDuration,
                    location.x,
                    location.y,
                    endAngle
                );

                keyframes.push(endKeyframe);
                prevKeyframe = endKeyframe;
            } else {
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

    return true;
}
