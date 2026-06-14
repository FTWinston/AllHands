import { entity, type, view } from '@colyseus/schema';
import { ownHelmClientRole, ownScienceClientRole, ownTacticalClientRole, ownEngineerClientRole } from 'common-data/features/ships/types/CrewRole';
import { ShipSystem, shipSystems } from 'common-data/features/ships/types/ShipSystem';
import { Damage } from 'common-data/features/space/types/Damage';
import { ShipInfo, ShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { distanceSq } from 'common-data/features/space/utils/vectors';
import { GameObject } from './GameObject';
import { GameState } from './GameState';
import { MobileObject } from './MobileObject';
import { MotionKeyframe } from './MotionKeyframe';
import { EngineerState } from './systems/engineer/EngineerState';
import { HelmState } from './systems/HelmState';
import { HullSystemState } from './systems/HullSystemState';
import { ReactorSystemState } from './systems/ReactorSystemState';
import { ScienceState } from './systems/science/ScienceState';
import { SystemState } from './systems/SystemState';
import { TacticalState } from './systems/tactical/TacticalState';

@entity
export abstract class Ship extends MobileObject implements ShipInfo {
    constructor(
        gameState: GameState,
        setup: ShipSetupInfo
    ) {
        super(
            gameState,
            setup,
            new MotionKeyframe(gameState.currentTime, setup.position.x, setup.position.y, setup.position.angle)
        );

        const getCardId = () => this.getCardId();
        this.hullState = new HullSystemState(setup.hull, gameState, this);
        this.reactorState = new ReactorSystemState(setup.reactor, gameState, this);

        // Randomize the order of systems on the scan interface, so each ship is different.
        const scanSystemOrder = [0, 1, 2, 3];
        gameState.random.shuffle(scanSystemOrder);

        this.helmState = new HelmState(setup.helm, gameState, this, scanSystemOrder[0], getCardId);
        this.scienceState = new ScienceState(setup.science, gameState, this, scanSystemOrder[1], getCardId);
        this.tacticalState = new TacticalState(setup.tactical, gameState, this, scanSystemOrder[2], getCardId);
        this.engineerState = new EngineerState(setup.engineer, gameState, this, scanSystemOrder[3], getCardId);

        this.engineerState.initSystems();

        this.systems = new Map<ShipSystem, SystemState>([
            ['hull', this.hullState],
            ['reactor', this.reactorState],
            ['helm', this.helmState],
            ['science', this.scienceState],
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
    @view(ownHelmClientRole) @type(HelmState) helmState: HelmState;
    @view(ownScienceClientRole) @type(ScienceState) scienceState: ScienceState;
    @view(ownTacticalClientRole) @type(TacticalState) tacticalState: TacticalState;
    @view(ownEngineerClientRole) @type(EngineerState) engineerState: EngineerState;

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
        // this.scienceState.update(currentTime);
        this.tacticalState.update(currentTime);
        this.engineerState.update(currentTime);
    }

    updateKnownObjects(currentTime: number) {
        const ownPosition = this.getPosition(currentTime);

        for (const objectId of this._knownObjects) {
            if (!this.gameState.objects.has(objectId)) {
                // Object was removed from the game, so remove from known objects.
                this.removeKnownObjectId(objectId);
            }
        }

        for (const [objectId, object] of this.gameState.objects.entries()) {
            const objectPosition = object.getPosition(currentTime);
            const inRange = distanceSq(ownPosition, objectPosition) <= this.detectionRangeSq;

            if (inRange && !this._knownObjects.has(objectId)) {
                this.addKnownObject(objectId, object);
            } else if (!inRange && this._knownObjects.has(objectId)) {
                this.removeKnownObject(objectId, object);
            }
        }
    }

    private readonly _knownObjects = new Set<string>();

    get knownObjects(): ReadonlySet<string> {
        return this._knownObjects;
    }

    protected addKnownObject(objectId: string, _object: GameObject) {
        this._knownObjects.add(objectId);
    }

    protected removeKnownObject(objectId: string, _object: GameObject) {
        this.removeKnownObjectId(objectId);
    }

    private removeKnownObjectId(objectId: string) {
        this._knownObjects.delete(objectId);

        this.tacticalState.vulnerabilitiesByTarget.delete(objectId);
        this.scienceState.unsubscribeFromShip(objectId);
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
        // Broadcast explosion effect before removal.
        this.gameState.broadcastWeaponEffect({
            type: 'explosion',
            sourceId: this.id,
            color: '#ff6600',
            thickness: 0.5,
            brightness: 3,
            duration: 1500,
            startTime: this.gameState.currentTime,
        });

        // Clean up any active science scans so the beingScanned effect is removed from targets.
        this.scienceState.unsubscribeFromShip();

        super.destroy();
    }
}
