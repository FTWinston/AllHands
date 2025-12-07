import { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { Position } from 'common-data/features/space/types/Position';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { GameObject } from './GameObject';
import { MotionKeyframe } from './MotionKeyframe';

export abstract class StaticObject extends GameObject {
    constructor(
        id: string,
        relationship: RelationshipType,
        appearance: ObjectAppearance,
        position: Position) {
        super(id, relationship, appearance);

        this.motion.push(new MotionKeyframe(0, position.x, position.y, position.angle));
    }

    protected updateMotion(_currentTime: number) {};
}
