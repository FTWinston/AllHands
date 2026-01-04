import { entity } from '@colyseus/schema';
import { GameObjectSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { cullFutureKeyframes, prunePastKeyframes } from 'common-data/features/space/utils/interpolate';
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
        prunePastKeyframes(this.motion, currentTime);
    }

    public setMotion(...keyframes: MotionKeyframe[]) {
        // Remove future keyframes, then add the new keyframes, which should include a "now" keyframe.
        cullFutureKeyframes(this.motion, this.gameState.clock.currentTime);

        this.motion.push(...keyframes);
    }
}
