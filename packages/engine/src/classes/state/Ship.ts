import { type, view } from '@colyseus/schema';
import { helmClientRole, sensorClientRole, tacticalClientRole, engineerClientRole } from 'common-data/features/ships/types/CrewRole';
import { ShipInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { Position } from 'common-data/features/space/types/Position';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { MobileObject } from './MobileObject';
import { SystemState } from './SystemState';

export abstract class Ship extends MobileObject implements ShipInfo {
    constructor(
        id: string,
        relationship: RelationshipType,
        appearance: ObjectAppearance,
        position: Position) {
        super(id, relationship, appearance, position);
    }

    @view(helmClientRole) @type(SystemState) helmState: SystemState = new SystemState([]);
    @view(sensorClientRole) @type(SystemState) sensorState: SystemState = new SystemState([]);
    @view(tacticalClientRole) @type(SystemState) tacticalState: SystemState = new SystemState([]);
    @view(engineerClientRole) @type(SystemState) engineerState: SystemState = new SystemState([]);

    // TODO: map of system effects, including their health. @view(engineerClientRole)

    // TODO: array of slotted weapons. @view(tacticalClientRole)

    protected updateMotion(_currentTime: number) {
        // TODO: this
    }
}
