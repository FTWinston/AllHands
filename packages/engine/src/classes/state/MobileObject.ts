import { entity } from '@colyseus/schema';
import { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { GameObject } from './GameObject';
import { GameState } from './GameState';
import { MotionKeyframe } from './MotionKeyframe';

@entity
export abstract class MobileObject extends GameObject {
    constructor(
        gameState: GameState,
        relationship: RelationshipType,
        appearance: ObjectAppearance,
        ...motion: MotionKeyframe[]
    ) {
        super(gameState, relationship, appearance);

        this.motion.push(...motion);
    }

    public override tick(deltaTime: number) {
        super.tick(deltaTime);

        this.updateMotion();
    }

    protected abstract updateMotion(): void;
}
