import { CardMotionDataPoint } from 'common-data/features/cards/types/CardDefinition';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
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

        let angle: number;

        // TODO: do multiple keyframes so the ship can e.g. rotate then move forwards.
        if (dataPoint.face === 'nextVector' && i + 1 < locations.length) {
            const nextVector = locations[i + 1];
            angle = -Math.atan2(nextVector.y - location.y, nextVector.x - location.x);
        } else if (dataPoint.face === 'previousVector' && i - 1 >= 0) {
            angle = -Math.atan2(location.y - prevKeyframe.y, location.x - prevKeyframe.x);
        } else if (dataPoint.face === 'finalVector' && locations.length >= 1) {
            const finalVector = locations[locations.length - 1];
            angle = -Math.atan2(finalVector.y - currentPosition.y, finalVector.x - currentPosition.x);
        } else {
            angle = prevKeyframe.angle;
        }

        const distance = Math.hypot(location.x - prevKeyframe.x, location.y - prevKeyframe.y);

        // TODO: apply helm power level to the base speed here.
        const duration = (distance / dataPoint.baseSpeed) * 1000;

        const newKeyframe = new MotionKeyframe(
            prevKeyframe.time + duration,
            location.x,
            location.y,
            angle
        );

        keyframes.push(newKeyframe);
        prevKeyframe = newKeyframe;
    }

    ship.setMotion(...keyframes);

    return true;
}
