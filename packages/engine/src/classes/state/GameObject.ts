import { ArraySchema, Schema, type } from '@colyseus/schema';
import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { Position } from 'common-data/features/space/types/Position';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { interpolatePosition } from 'common-data/features/space/utils/interpolate';
import { MotionKeyframe } from './MotionKeyframe';

export abstract class GameObject extends Schema implements GameObjectInfo {
    constructor(
        id: string,
        relationship: RelationshipType,
        appearance: ObjectAppearance) {
        super();
        this.id = id;
        this.relationship = relationship;
        this.appearance = appearance;
    }

    @type('string') public readonly id: string;

    @type('string') public readonly appearance: ObjectAppearance;

    @type('number') relationship: RelationshipType;

    @type([MotionKeyframe]) motion = new ArraySchema<MotionKeyframe>();

    getPosition(currentTime: number): Position {
        return interpolatePosition(this.motion, currentTime);
    }

    public tick(currentTime: number) {
        this.updateMotion(currentTime);
    }

    protected abstract updateMotion(currentTime: number): void;
}
