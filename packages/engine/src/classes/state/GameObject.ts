import { ArraySchema, Schema, type } from '@colyseus/schema';
import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { Position } from 'common-data/features/space/types/Position';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { interpolatePosition } from 'common-data/features/space/utils/interpolate';
import { IRandom } from 'common-data/types/IRandom';
import { GameState } from './GameState';
import { MotionKeyframe } from './MotionKeyframe';

export abstract class GameObject extends Schema implements GameObjectInfo {
    constructor(
        protected readonly gameState: GameState,
        relationship: RelationshipType,
        appearance: ObjectAppearance) {
        super();
        this.id = gameState.getNewId();
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

    public get random(): IRandom {
        return this.gameState.random;
    }

    public tick(_deltaTime: number) {
        this.updateMotion();
    }

    protected abstract updateMotion(): void;
}
