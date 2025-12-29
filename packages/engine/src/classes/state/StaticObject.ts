import { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { Position } from 'common-data/features/space/types/Position';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { GameObject } from './GameObject';
import { GameState } from './GameState';
import { MotionKeyframe } from './MotionKeyframe';

export abstract class StaticObject extends GameObject {
    constructor(
        gameState: GameState,
        relationship: RelationshipType,
        appearance: ObjectAppearance,
        position: Position
    ) {
        super(gameState, relationship, appearance);

        this.motion.push(new MotionKeyframe(0, position.x, position.y, position.angle));
    }
}
