import { type, view } from '@colyseus/schema';
import { helmClientRole, sensorClientRole, tacticalClientRole, engineerClientRole } from 'common-data/features/ships/types/CrewRole';
import { ShipInfo, ShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { GameState } from './GameState';
import { MobileObject } from './MobileObject';
import { SystemState } from './SystemState';

export abstract class Ship extends MobileObject implements ShipInfo {
    constructor(
        gameState: GameState,
        relationship: RelationshipType,
        appearance: ObjectAppearance,
        setup: ShipSetupInfo
    ) {
        super(gameState, relationship, appearance, setup.position);

        const getCardId = () => this.getCardId();
        this.helmState = new SystemState(setup.helm, this, getCardId);
        this.sensorState = new SystemState(setup.sensors, this, getCardId);
        this.tacticalState = new SystemState(setup.tactical, this, getCardId);
        this.engineerState = new SystemState(setup.engineer, this, getCardId);
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

    public tick(deltaTime: number) {
        super.tick(deltaTime);

        const currentTime = this.gameState.clock.currentTime;

        this.helmState.update(currentTime);
        this.sensorState.update(currentTime);
        this.tacticalState.update(currentTime);
        this.engineerState.update(currentTime);
    }

    protected updateMotion() {
        // TODO: this
    }
}
