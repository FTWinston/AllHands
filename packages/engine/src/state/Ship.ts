import { entity, type, view } from '@colyseus/schema';
import { helmClientRole, sensorClientRole, tacticalClientRole, engineerClientRole } from 'common-data/features/ships/types/CrewRole';
import { ShipInfo, ShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
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
        this.helmState = new HelmState(setup.helm, gameState, this, getCardId);
        this.sensorState = new SystemState(setup.sensors, gameState, this, getCardId);
        this.tacticalState = new SystemState(setup.tactical, gameState, this, getCardId);
        this.engineerState = new EngineerState(setup.engineer, gameState, this, getCardId);

        this.engineerState.initSystems();
    }

    private nextCardId = 1;

    getCardId() {
        return this.nextCardId++;
    }

    @view(helmClientRole) @type(HelmState) helmState: HelmState;
    @view(sensorClientRole) @type(SystemState) sensorState: SystemState;
    @view(tacticalClientRole) @type(SystemState) tacticalState: SystemState;
    @view(engineerClientRole) @type(EngineerState) engineerState: EngineerState;

    // TODO: array of slotted weapons. @view(tacticalClientRole)

    public tick(deltaTime: number, currentTime: number) {
        super.tick(deltaTime, currentTime);

        this.helmState.update(currentTime);
        this.sensorState.update(currentTime);
        this.tacticalState.update(currentTime);
        this.engineerState.update(currentTime);
    }
}
