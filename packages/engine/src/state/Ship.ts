import { entity, type, view } from '@colyseus/schema';
import { helmClientRole, sensorClientRole, tacticalClientRole, engineerClientRole } from 'common-data/features/ships/types/CrewRole';
import { ShipSystem, shipSystems } from 'common-data/features/ships/types/ShipSystem';
import { Damage } from 'common-data/features/space/types/Damage';
import { ShipInfo, ShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { distanceSq } from 'common-data/features/space/utils/vectors';
import { CrewSystemState } from './CrewSystemState';
import { EngineerState } from './EngineerState';
import { GameState } from './GameState';
import { HelmState } from './HelmState';
import { HullSystemState } from './HullSystemState';
import { MobileObject } from './MobileObject';
import { MotionKeyframe } from './MotionKeyframe';
import { ReactorSystemState } from './ReactorSystemState';
import { SystemState } from './SystemState';
import { TacticalState } from './TacticalState';

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
        this.tacticalState = new TacticalState(setup.tactical, gameState, this, getCardId);
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
    @view(tacticalClientRole) @type(TacticalState) tacticalState: TacticalState;
    @view(engineerClientRole) @type(EngineerState) engineerState: EngineerState;

    private systems: ReadonlyMap<ShipSystem, SystemState>;

    public getSystem(system: ShipSystem): SystemState {
        const systemState = this.systems.get(system);
        if (!systemState) {
            throw new Error(`Ship does not have system ${system}`);
        }
        return systemState;
    }

    private readonly detectionRange = 100;
    private readonly detectionRangeSq = this.detectionRange ** 2;
    private readonly detectionInterval = 200;
    private detectionTimer = 0;

    public tick(deltaTime: number, currentTime: number) {
        super.tick(deltaTime, currentTime);

        this.detectionTimer += deltaTime;
        if (this.detectionTimer >= this.detectionInterval) {
            this.detectionTimer = 0;
            this.updateKnownObjects(currentTime);
        }

        this.helmState.update(currentTime);
        // this.sensorState.update(currentTime);
        this.tacticalState.update(currentTime);
        this.engineerState.update(currentTime);
    }

    updateKnownObjects(currentTime: number) {
        const ownPosition = this.getPosition(currentTime);

        for (const [objectId, object] of this.gameState.objects.entries()) {
            const objectPosition = object.getPosition(currentTime);
            const inRange = distanceSq(ownPosition, objectPosition) <= this.detectionRangeSq;

            if (inRange && !this.knownObjects.has(objectId)) {
                this.addKnownObject(objectId);
            } else if (!inRange && this.knownObjects.has(objectId)) {
                this.removeKnownObject(objectId);
            }
        }
    }

    readonly knownObjects: ReadonlySet<string> = new Set<string>();

    addKnownObject(objectId: string) {
        (this.knownObjects as Set<string>).add(objectId);

        // TODO: add to objects visible on helm and viewscreen.
        // TODO: add to tactical target list.
        // TODO: add to sensors target list.
    }

    removeKnownObject(objectId: string) {
        (this.knownObjects as Set<string>).delete(objectId);
        // TODO: remove from objects visible on helm and viewscreen.
        // TODO: remove from tactical target list.
        // TODO: remove from sensors target list.
    }

    damage(damage: Damage) {
        if (!damage.targetSystem) {
            damage.targetSystem = this.random.pick(shipSystems);
        }

        const remainingAmount = this.hullState.damageShields(damage);

        let targetSystemDamage: number;

        if (damage.targetSystem === 'hull') {
            // If targeting the hull, or it's what was randomly picked, all damage goes there.
            targetSystemDamage = remainingAmount;
        } else {
            // Otherwise, damage type and delivery method both affect how damage splits between
            // the targeted (or randomly picked) system and the hull.
            let hullDamageScale: number;
            switch (damage.deliveryMethod) {
                case 'beam':
                    hullDamageScale = damage.targetSystem ? 0.2 : 0.4;
                    break;
                case 'projectile':
                    hullDamageScale = damage.targetSystem ? 0.8 : 0.9;
                    break;
            }

            const systemDamageScale = 1 - hullDamageScale;

            targetSystemDamage = Math.ceil(remainingAmount * systemDamageScale);
            const hullDamage = remainingAmount - targetSystemDamage;

            this.hullState.adjustHealth(-hullDamage);
        }

        const targetSystem = this.getSystem(damage.targetSystem);

        targetSystem
            .adjustHealth(-targetSystemDamage);

        switch (damage.damageType) {
            case 'ion':
                if (targetSystemDamage > 0) {
                    targetSystem
                        .adjustEffectLevel('disruptGeneration', 1);
                }
        }
    }

    override destroy() {
        // TODO: add explosion?

        super.destroy();
    }
}
