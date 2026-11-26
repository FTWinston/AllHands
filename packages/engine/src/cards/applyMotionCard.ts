import { LocationTargetCardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { calculateMotionPath, MotionPathOptions } from 'common-data/features/cards/utils/calculateMotionPath';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { CardState } from 'src/state/CardState';
import { CardCooldownState } from '../state/CardCooldownState';
import { GameState } from '../state/GameState';
import { MotionKeyframe } from '../state/MotionKeyframe';
import { Ship } from '../state/Ship';

export function applyMotionCard(
    gameState: GameState,
    ship: Ship,
    cardInstance: CardState,
    cardDefinition: LocationTargetCardDefinition,
    location: Vector2D,
    parameters: CardParameters,
    pathOptions?: MotionPathOptions
): boolean {
    const startTime = gameState.currentTime;
    // Anything speeding the helm's maneuvers up or slowing them down (e.g. Momentum) changes how long the move takes.
    const path = calculateMotionPath(ship.getPosition(startTime), cardDefinition, location, {
        speedMultiplier: ship.helmState.maneuverSpeedMultiplier,
        ...pathOptions,
    });

    // The move is outside the limits set in the card data.
    if (!path) {
        return false;
    }

    const keyframes = path.map(keyframe => new MotionKeyframe(startTime + keyframe.time, keyframe.x, keyframe.y, keyframe.angle));
    ship.setMotion(...keyframes);

    // Record this maneuver on the ship's helm, so it can be cancelled if the helm doesn't maintain sufficient power.
    ship.helmState.setActiveManeuver(new CardCooldownState(
        cardInstance,
        startTime,
        keyframes[keyframes.length - 1].time,
        parameters['cost']
    ));

    return true;
}
