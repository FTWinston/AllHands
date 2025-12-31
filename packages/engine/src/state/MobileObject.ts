import { entity } from '@colyseus/schema';
import { GameObjectSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { pruneKeyframes } from 'common-data/features/space/utils/interpolate';
import { GameObject } from './GameObject';
import { GameState } from './GameState';
import { MotionKeyframe } from './MotionKeyframe';

@entity
export abstract class MobileObject extends GameObject {
    constructor(
        gameState: GameState,
        setup: GameObjectSetupInfo,
        ...motion: MotionKeyframe[]
    ) {
        super(gameState, setup);

        this.motion.push(...motion);
    }

    public override tick(deltaTime: number, currentTime: number) {
        super.tick(deltaTime, currentTime);

        this.updateMotion(currentTime);
    }

    protected updateMotion(currentTime: number) {
        pruneKeyframes(this.motion, currentTime);
    }
}
