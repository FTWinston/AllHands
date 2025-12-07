import { ArraySchema, Schema, type } from '@colyseus/schema';
import { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { MotionKeyframe } from './MotionKeyframe';

export abstract class GameObject extends Schema {
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

    public tick(currentTime: number) {
        this.updateMotion(currentTime);
    }

    protected abstract updateMotion(currentTime: number): void;
}
