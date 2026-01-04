import { CardMotionDataPoint } from 'common-data/features/cards/types/CardDefinition';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { clampAngle, determineAngle, distance } from 'common-data/features/space/utils/vectors';
import { GameState } from '../state/GameState';
import { MotionKeyframe } from '../state/MotionKeyframe';
import { Ship } from '../state/Ship';

export function applyMotionCard(
    gameState: GameState,
    ship: Ship,
    motionData: CardMotionDataPoint[],
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

        const startAngle = prevKeyframe.angle;
        let endAngle: number;

        if (dataPoint.face === 'nextVector' && i + 1 < locations.length) {
            const nextVector = locations[i + 1];
            endAngle = determineAngle(location, nextVector);
        } else if (dataPoint.face === 'previousVector' && i - 1 >= 0) {
            endAngle = determineAngle(prevKeyframe, location);
        } else if (dataPoint.face === 'finalVector' && locations.length >= 1) {
            const finalVector = locations[locations.length - 1];
            endAngle = determineAngle(prevKeyframe, finalVector);
        } else {
            endAngle = prevKeyframe.angle;
        }

        // Rotate (if needed), then move.
        const angleDiff = Math.abs(clampAngle(endAngle - startAngle));

        if (angleDiff > 0.001) {
            // TODO: apply helm power (or other ship rotation modifiers) to the rotation speed here.
            const rotateDuration = (angleDiff / Math.PI) * 4000; // 4 seconds to rotate 180 degrees.

            const rotatedKeyframe = new MotionKeyframe(
                prevKeyframe.time + rotateDuration,
                prevKeyframe.x,
                prevKeyframe.y,
                endAngle
            );

            keyframes.push(rotatedKeyframe);
            prevKeyframe = rotatedKeyframe;
        }

        const moveDistance = distance(location, prevKeyframe);

        if (moveDistance > 0.001) {
            // TODO: apply helm power (or other ship movement modifiers) to the base speed here.
            const moveDuration = (moveDistance / dataPoint.baseSpeed) * 1000;

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

    return true;
}
