import { GameObjectSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { Position } from 'common-data/features/space/types/Position';
import { GameObject } from './GameObject';
import { GameState } from './GameState';
import { MotionKeyframe } from './MotionKeyframe';

export abstract class StaticObject extends GameObject {
    constructor(
        gameState: GameState,
        setup: GameObjectSetupInfo,
        position: Position
    ) {
        super(gameState, setup);

        this.motion.push(new MotionKeyframe(0, position.x, position.y, position.angle));
    }
}
