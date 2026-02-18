import { entity, type, view } from '@colyseus/schema';
import { helmClientRole, sensorClientRole, tacticalClientRole, engineerClientRole } from 'common-data/features/ships/types/CrewRole';
import { ShipInfo, ShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CrewSystemState } from './CrewSystemState';
import { EngineerState } from './EngineerState';
import { GameState } from './GameState';
import { HelmState } from './HelmState';
import { MobileObject } from './MobileObject';
import { MotionKeyframe } from './MotionKeyframe';
import { SystemState } from './SystemState';

@entity
export abstract class Ship extends MobileObject implements ShipInfo {
    constructor(
        gameState: GameState,
        setup: ShipSetupInfo
    ) {
        super(
            gameState,
            setup,
            new MotionKeyframe(gameState.clock.currentTime, setup.position.x, setup.position.y, setup.position.angle)
        );

        const getCardId = () => this.getCardId();
        this.hullState = new SystemState(setup.hull, gameState, this);
        this.shieldState = new SystemState(setup.shields, gameState, this);
        this.helmState = new HelmState(setup.helm, gameState, this, getCardId);
        this.sensorState = new CrewSystemState(setup.sensors, gameState, this, getCardId);
        this.tacticalState = new CrewSystemState(setup.tactical, gameState, this, getCardId);
        this.engineerState = new EngineerState(setup.engineer, gameState, this, getCardId);

        this.engineerState.initSystems();
    }

    private nextCardId = 1;

    getCardId() {
        return this.nextCardId++;
    }

    hullState: SystemState;
    shieldState: SystemState;
    @view(helmClientRole) @type(HelmState) helmState: HelmState;
    @view(sensorClientRole) @type(CrewSystemState) sensorState: CrewSystemState;
    @view(tacticalClientRole) @type(CrewSystemState) tacticalState: CrewSystemState;
    @view(engineerClientRole) @type(EngineerState) engineerState: EngineerState;

    // TODO: array of slotted weapons. @view(tacticalClientRole)

    public tick(deltaTime: number, currentTime: number) {
        super.tick(deltaTime, currentTime);

        this.helmState.update(currentTime);
        // this.sensorState.update(currentTime);
        // this.tacticalState.update(currentTime);
        this.engineerState.update(currentTime);
    }
}
