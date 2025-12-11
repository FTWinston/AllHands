import { type, view } from '@colyseus/schema';
import { helmClientRole, sensorClientRole, tacticalClientRole, engineerClientRole } from 'common-data/features/ships/types/CrewRole';
import { ShipInfo, ShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { MobileObject } from './MobileObject';
import { SystemState } from './SystemState';

export abstract class Ship extends MobileObject implements ShipInfo {
    constructor(
        id: string,
        relationship: RelationshipType,
        appearance: ObjectAppearance,
        setup: ShipSetupInfo
    ) {
        super(id, relationship, appearance, setup.position);

        const getCardId = () => this.getCardId();
        this.helmState = new SystemState(setup.helm, getCardId);
        this.sensorState = new SystemState(setup.sensors, getCardId);
        this.tacticalState = new SystemState(setup.tactical, getCardId);
        this.engineerState = new SystemState(setup.engineer, getCardId);
    }

    private nextCardId = 1;

    getCardId() {
        return this.nextCardId++;
    }

    @view(helmClientRole) @type(SystemState) helmState: SystemState;
    @view(sensorClientRole) @type(SystemState) sensorState: SystemState;
    @view(tacticalClientRole) @type(SystemState) tacticalState: SystemState;
    @view(engineerClientRole) @type(SystemState) engineerState: SystemState;

    // TODO: map of system effects, including their health. @view(engineerClientRole)

    // TODO: array of slotted weapons. @view(tacticalClientRole)

    protected updateMotion(_currentTime: number) {
        // TODO: this
    }
}
