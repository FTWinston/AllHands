import { entity, type, view } from '@colyseus/schema';
import { helmClientRole, sensorClientRole, tacticalClientRole, engineerClientRole } from 'common-data/features/ships/types/CrewRole';
import { ShipSystem, shipSystems } from 'common-data/features/ships/types/ShipSystem';
import { ShipInfo, ShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CrewSystemState } from './CrewSystemState';
import { EngineerState } from './EngineerState';
import { GameState } from './GameState';
import { HelmState } from './HelmState';
import { HullSystemState } from './HullSystemState';
import { MobileObject } from './MobileObject';
import { MotionKeyframe } from './MotionKeyframe';
import { ReactorSystemState } from './ReactorSystemState';
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
        this.hullState = new HullSystemState(setup.hull, gameState, this);
        this.reactorState = new ReactorSystemState(setup.reactor, gameState, this);
        this.helmState = new HelmState(setup.helm, gameState, this, getCardId);
        this.sensorState = new CrewSystemState(setup.sensors, gameState, this, getCardId);
        this.tacticalState = new CrewSystemState(setup.tactical, gameState, this, getCardId);
        this.engineerState = new EngineerState(setup.engineer, gameState, this, getCardId);

        this.engineerState.initSystems();

        this.systems = new Map<ShipSystem, SystemState>([
            ['hull', this.hullState],
            ['reactor', this.reactorState],
            ['helm', this.helmState],
            ['sensors', this.sensorState],
            ['tactical', this.tacticalState],
            ['engineer', this.engineerState],
        ]);
    }

    private nextCardId = 1;

    getCardId() {
        return this.nextCardId++;
    }

    hullState: HullSystemState;
    reactorState: ReactorSystemState;
    @view(helmClientRole) @type(HelmState) helmState: HelmState;
    @view(sensorClientRole) @type(CrewSystemState) sensorState: CrewSystemState;
    @view(tacticalClientRole) @type(CrewSystemState) tacticalState: CrewSystemState;
    @view(engineerClientRole) @type(EngineerState) engineerState: EngineerState;

    private systems: ReadonlyMap<ShipSystem, SystemState>;

    public getSystem(system: ShipSystem): SystemState {
        const systemState = this.systems.get(system);
        if (!systemState) {
            throw new Error(`Ship does not have system ${system}`);
        }
        return systemState;
    }

    // TODO: array of slotted weapons. @view(tacticalClientRole)

    public tick(deltaTime: number, currentTime: number) {
        super.tick(deltaTime, currentTime);

        this.helmState.update(currentTime);
        // this.sensorState.update(currentTime);
        // this.tacticalState.update(currentTime);
        this.engineerState.update(currentTime);
    }

    damage(amount: number, targetSystem: ShipSystem | null = null) {
        const remainingAmount = this.hullState.damageShields(amount);

        if (targetSystem === null) {
            targetSystem = this.random.pick(shipSystems);
        }

        let hullDamage: number;

        if (targetSystem === 'hull') {
            hullDamage = remainingAmount;
        } else {
            // Split remaining damage between the target system and the hull.
            const targetSystemDamage = Math.ceil(remainingAmount / 2);
            hullDamage = remainingAmount - targetSystemDamage;

            this.getSystem(targetSystem)
                .adjustHealth(-targetSystemDamage);
        }

        this.hullState.adjustHealth(-hullDamage);
    }
}
