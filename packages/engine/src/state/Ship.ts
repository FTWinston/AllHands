import { entity, type, view } from '@colyseus/schema';
import { helmClientRole, sensorClientRole, tacticalClientRole, engineerClientRole } from 'common-data/features/ships/types/CrewRole';
import { ShipSystem, shipSystems } from 'common-data/features/ships/types/ShipSystem';
import { Damage } from 'common-data/features/space/types/Damage';
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

    damage(damage: Damage) {
        const remainingAmount = this.hullState.damageShields(damage);

        const targetSystem = damage.targetSystem ?? this.random.pick(shipSystems);

        let hullDamage: number;

        if (targetSystem === 'hull') {
            // If targeting the hull, or it's randomly picked, all damage goes there.
            hullDamage = remainingAmount;
        } else {
            // Otherwise, damage type and delivery method both affect how damage splits between
            // the targeted (or randomly picked) system and the hull.
            let hullDamageScale: number;

            switch (damage.deliveryMethod) {
                case 'beam':
                    hullDamageScale = damage.targetSystem ? 0.2 : 0.4;
                    break;
                case 'pulse':
                    hullDamageScale = damage.targetSystem ? 0.5 : 0.7;
                    break;
                case 'blast':
                    hullDamageScale = damage.targetSystem ? 0.7 : 0.9;
                    break;
                default:
                    hullDamageScale = 0.5;
                    break;
            }

            switch (damage.damageType) {
                case 'disruptor':
                    hullDamageScale += 0.2;
                    break;
                case 'ion':
                    hullDamageScale -= 0.4;
                    break;
                case 'plasma':
                    hullDamageScale += 0.1;
                    break;
                case 'antimatter':
                    hullDamageScale += 0.2;
                    break;
                case 'tachyon':
                    hullDamageScale -= 0.2;
                    break;
            }

            hullDamageScale = Math.min(Math.max(hullDamageScale, 0), 0.95); // Clamp to [0, 0.95]

            const systemDamageScale = 1 - hullDamageScale;

            const targetSystemDamage = Math.ceil(remainingAmount * systemDamageScale);
            hullDamage = remainingAmount - targetSystemDamage;

            this.getSystem(targetSystem)
                .adjustHealth(-targetSystemDamage);
        }

        this.hullState.adjustHealth(-hullDamage);
    }
}
