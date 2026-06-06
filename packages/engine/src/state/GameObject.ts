import { ArraySchema, Schema, type, view } from '@colyseus/schema';
import { otherHelmClientRole, otherScienceClientRole, otherShipClientRole, otherTacticalClientRole, ownHelmClientRole, ownShipClientRole, ownTacticalClientRole } from 'common-data/features/ships/types/CrewRole';
import { Damage } from 'common-data/features/space/types/Damage';
import { GameObjectInfo, GameObjectSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
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
        setup: GameObjectSetupInfo
    ) {
        super();
        this.id = gameState.getNewId();
        this.name = setup.name;
        this.relationship = setup.relationship;
        this.appearance = setup.appearance;
    }

    @type('string') public readonly id: string;

    @view(ownHelmClientRole | ownShipClientRole | otherHelmClientRole | otherShipClientRole | otherTacticalClientRole | otherScienceClientRole)
    @type('string') public readonly name: string;

    @view(ownHelmClientRole | ownShipClientRole | otherHelmClientRole | otherShipClientRole | otherTacticalClientRole | otherScienceClientRole)
    @type('string') public readonly appearance: ObjectAppearance;

    @view(ownHelmClientRole | ownShipClientRole | otherHelmClientRole | otherShipClientRole | otherTacticalClientRole | otherScienceClientRole)
    @type('number') relationship: RelationshipType;

    @view(ownHelmClientRole | ownShipClientRole | otherHelmClientRole | otherShipClientRole | ownTacticalClientRole | otherTacticalClientRole)
    @type([MotionKeyframe]) motion = new ArraySchema<MotionKeyframe>();

    getPosition(currentTime: number): Position {
        return interpolatePosition(this.motion, currentTime);
    }

    public get random(): IRandom {
        return this.gameState.random;
    }

    public tick(_deltaTime: number, _currentTime: number) {}

    damage(_damage: Damage) {
        // Can't damage an arbitrary game object, but subclasses can override this to be damageable.
    }

    destroy() {
        this.gameState.remove(this);
    }
}
