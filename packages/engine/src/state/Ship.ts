import { entity, type, view } from '@colyseus/schema';
import { CardType, EnemyTargetedCardType, UntargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { ownShipClientRole, ownHelmClientRole, ownScienceClientRole, ownTacticalClientRole, ownEngineerClientRole, CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { ShipHit } from 'common-data/features/ships/types/ShipHit';
import { ShipSystem, shipSystems } from 'common-data/features/ships/types/ShipSystem';
import { extendedShieldsRange } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { Damage } from 'common-data/features/space/types/Damage';
import { ShipInfo, ShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { distanceSq } from 'common-data/features/space/utils/vectors';
import { applyWeaponTrait } from 'src/cards/applyWeaponTrait';
import { ListenableEvent } from 'src/classes/ListenableEvent';
import { GameObject } from './GameObject';
import { GameState } from './GameState';
import { MobileObject } from './MobileObject';
import { MotionKeyframe } from './MotionKeyframe';
import { EngineerState } from './systems/engineer/EngineerState';
import { HelmState } from './systems/HelmState';
import { HullState } from './systems/HullState';
import { ReactorState } from './systems/ReactorState';
import { ScannedHullState } from './systems/science/ScannedHullState';
import { ScienceState } from './systems/science/ScienceState';
import { SystemState } from './systems/SystemState';
import { TacticalState } from './systems/tactical/TacticalState';
import type { CrewSystemState } from './systems/CrewSystemState';

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

        // Randomize the order of systems on the scan interface, so each ship is different.
        const scanSystemOrder = [0, 1, 2, 3];
        gameState.random.shuffle(scanSystemOrder);

        const getCardId = () => this.getCardId();

        // The reactor cards determine how much baseline power each system gets.
        const {
            reactorPowerHull: initialHullPower,
            reactorPowerReactor: initialReactorPower,
            reactorPowerHelm: initialHelmPower,
            reactorPowerScience: initialSciencePower,
            reactorPowerTactical: initialTacticalPower,
            reactorPowerEngineer: initialEngineerPower,
        } = determineSystemPowerFromReactorCards(setup.reactor.cards);

        this.hullState = new HullState(setup.hull, gameState, this, initialHullPower ?? 0, getCardId);
        this.reactorState = new ReactorState(setup.reactor, gameState, this, initialReactorPower ?? 0, getCardId);
        this.helmState = new HelmState(setup.helm, gameState, this, scanSystemOrder[0], initialHelmPower ?? 0, getCardId);
        this.scienceState = new ScienceState(setup.science, gameState, this, scanSystemOrder[1], initialSciencePower ?? 0, getCardId);
        this.tacticalState = new TacticalState(setup.tactical, gameState, this, scanSystemOrder[2], initialTacticalPower ?? 0, getCardId);
        this.engineerState = new EngineerState(setup.engineer, gameState, this, scanSystemOrder[3], initialEngineerPower ?? 0, getCardId);

        this.systems = new Map<ShipSystem, SystemState>([
            ['hull', this.hullState],
            ['reactor', this.reactorState],
            ['helm', this.helmState],
            ['science', this.scienceState],
            ['tactical', this.tacticalState],
            ['engineer', this.engineerState],
        ]);

        this.engineerState.initSystems();

        this.updateCardGeneration();
    }

    /** Fired whenever another ship's deflector is used on this one, with which ship it was and what its deflector was loaded with. */
    readonly deflectorReceived = new ListenableEvent<{ source: Ship; cardType: EnemyTargetedCardType }>();

    private nextCardId = 1;

    getCardId() {
        return this.nextCardId++;
    }

    /**
     * Record that this ship's crew has seen cards of these types: in their deck or hand, or offered in a shop.
     * Only player ships keep track of this (see `PlayerShip.seenCardTypes`); it does nothing for anyone else.
     */
    markCardTypesSeen(_types: Iterable<CardType>) {
        // Only player ships track seen cards.
    }

    @view(ownShipClientRole) @type(HullState) hullState: HullState;
    reactorState: ReactorState;
    @view(ownHelmClientRole) @type(HelmState) helmState: HelmState;
    @view(ownShipClientRole | ownScienceClientRole) @type(ScienceState) scienceState: ScienceState;
    @view(ownShipClientRole | ownTacticalClientRole) @type(TacticalState) tacticalState: TacticalState;
    @view(ownEngineerClientRole) @type(EngineerState) engineerState: EngineerState;

    /**
     * Kept up to date by this ship's science system, but synced to tactical too.
     * Its target is empty while science isn't scanning a ship, as Colyseus can't send a field that's null to only some clients.
     */
    @view(ownScienceClientRole | ownTacticalClientRole) @type(ScannedHullState) readonly scannedHull = new ScannedHullState();

    private systems: ReadonlyMap<ShipSystem, SystemState>;

    public getSystem(system: ShipSystem): SystemState {
        const systemState = this.systems.get(system);
        if (!systemState) {
            throw new Error(`Ship does not have system ${system}`);
        }
        return systemState;
    }

    /** The system belonging to the given crew member. */
    public getCrewSystem(role: CrewRoleName): CrewSystemState {
        return this.getSystem(role) as CrewSystemState;
    }

    private readonly detectionRange = 100;
    private readonly detectionRangeSq = this.detectionRange ** 2;
    private readonly detectionInterval = 200;
    // Detect surroundings on the first tick, so a ship spawned mid-encounter (e.g. an AI ship) knows what's around it straight away.
    private detectionTimer = this.detectionInterval;

    public tick(deltaTime: number, currentTime: number) {
        super.tick(deltaTime, currentTime);

        if (!this.gameState.isSimulatingSystems) {
            return;
        }

        this.detectionTimer += deltaTime;
        if (this.detectionTimer >= this.detectionInterval) {
            this.detectionTimer = 0;
            this.updateKnownObjects(currentTime);
        }

        this.reactorState.update(currentTime);
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
                this.deleteKnownObject(objectId);
            }
        }

        for (const [objectId, object] of this.gameState.objects.entries()) {
            const objectPosition = object.getPosition(currentTime);
            const inRange = distanceSq(ownPosition, objectPosition) <= this.detectionRangeSq;

            if (inRange && !this._knownObjects.has(objectId)) {
                this.addKnownObject(objectId, object);
            } else if (!inRange && this._knownObjects.has(objectId)) {
                this.removeObjectVisibility(objectId, object);
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

    protected removeObjectVisibility(objectId: string, _object: GameObject) {
        // Out of range: stop active scanning, but retain accumulated knowledge
        // (vulnerabilitiesByTarget and systemOrderByTarget persist until the ship is destroyed).
        this._knownObjects.delete(objectId);
        this.scienceState.unsubscribeFromShip(objectId);
    }

    private deleteKnownObject(objectId: string) {
        // Ship destroyed: full cleanup including all retained knowledge.
        this._knownObjects.delete(objectId);
        this.tacticalState.subTargetsByTarget.delete(objectId);
        this.scienceState.forgetShip(objectId);
    }

    override damage(damage: Damage): number {
        if (!damage.targetSystem) {
            damage.targetSystem = this.random.pick(shipSystems);
        }

        // A friendly ship that has extended its shields over this one takes the hit on them first. Whatever they let through then meets this ship's own.
        const extender = this.findShieldExtender();
        const remainingAmount = this.hullState.damageShields(extender
            ? { ...damage, amount: extender.hullState.damageShields(damage) }
            : damage);

        // Before applying the damage, as that could destroy the ship.
        this.wasHit({ damage: remainingAmount });

        let targetSystemDamage: number;

        if (damage.targetSystem === 'hull') {
            // If targeting the hull, or it's what was randomly picked, all damage goes there.
            targetSystemDamage = remainingAmount;
        } else {
            // TODO: Torpedo weapons should do more damage to the hull than energy weapons,
            // which should do more damage to the targeted system.
            const hullDamageScale = 0.4;

            const systemDamageScale = 1 - hullDamageScale;

            targetSystemDamage = Math.ceil(remainingAmount * systemDamageScale);
            const hullDamage = remainingAmount - targetSystemDamage;

            this.hullState.applyDamage.invoke(hullDamage);
        }

        const targetSystem = this.getSystem(damage.targetSystem);

        targetSystem
            .applyDamage.invoke(targetSystemDamage);

        for (const trait of damage.traits) {
            applyWeaponTrait(trait, this, targetSystem);
        }

        return remainingAmount;
    }

    /** Whether this ship's shields are extended over nearby friendly ships just now (see the Extend Shields card). */
    get hasExtendedShields(): boolean {
        return this.engineerState.systems.some(tile => tile.system === 'hull' && tile.hasEffect('shieldsExtended'));
    }

    /** The nearest friendly ship that is close enough, and has its shields extended, to take a hit meant for this one. */
    private findShieldExtender(): Ship | undefined {
        const currentTime = this.gameState.currentTime;
        const ownPosition = this.getPosition(currentTime);
        const registry = this.gameState.factionRegistry;
        let nearest: Ship | undefined;
        let nearestDistanceSq = extendedShieldsRange ** 2;

        for (const other of this.gameState.objects.values()) {
            if (other === this || !(other instanceof Ship) || !other.hasExtendedShields || registry.getRelationship(this, other) !== RelationshipType.Friendly) {
                continue;
            }

            const otherDistanceSq = distanceSq(ownPosition, other.getPosition(currentTime));
            if (otherDistanceSq <= nearestDistanceSq) {
                nearest = other;
                nearestDistanceSq = otherDistanceSq;
            }
        }

        return nearest;
    }

    /** Called whenever this ship is hit, just before the damage is applied. */
    protected wasHit(_hit: ShipHit) { }

    override destroy() {
        // Broadcast explosion effect before removal.
        this.gameState.broadcastWeaponEffect({
            type: 'explosion',
            sourceId: this.id,
            appearance: this.appearance,
            position: this.getPosition(this.gameState.currentTime),
            startTime: this.gameState.currentTime,
        });

        // Clean up any active science scans.
        this.scienceState.unsubscribeFromShip();

        super.destroy();
    }

    /** Show this ship jumping to warp, to everyone who can see it. That's all this does: whether the ship then goes anywhere is up to the caller. */
    showWarpAway() {
        this.gameState.broadcastWeaponEffect({
            type: 'warpAway',
            sourceId: this.id,
            appearance: this.appearance,
            position: this.getPosition(this.gameState.currentTime),
            startTime: this.gameState.currentTime,
        });
    }

    /**
     * Update the card generation timers displayed for each crew system. No cards are drawn outside an encounter, so there are no timers then.
     */
    updateCardGeneration() {
        if (this.gameState.isSimulatingSystems) {
            this.updateCrewCardGeneration();
        } else {
            this.clearCrewCardGeneration();
        }
    }

    /** Start card draws and generation timers over, at the beginning of an encounter. */
    startEncounter() {
        this.detectionTimer = 0;
        this.reactorState.resetCardGeneration();
        this.clearCrewCardGeneration();
        this.dealInitialHands();
        this.hullState.restoreShields();

        // Unconditional, as this runs just before the campaign enters the encounter phase.
        this.updateCrewCardGeneration();
    }

    /** Draw each system's initial hand from its deck. Ships hold no cards in hand until this is called, e.g. by `startEncounter`. */
    dealInitialHands() {
        for (const system of this.systems.values()) {
            system.dealInitialHand();
        }
    }

    private updateCrewCardGeneration() {
        this.helmState.updateCardGeneration();
        this.scienceState.updateCardGeneration();
        this.tacticalState.updateCardGeneration();
        this.engineerState.updateCardGeneration();
    }

    private clearCrewCardGeneration() {
        this.helmState.resetCardGeneration();
        this.scienceState.resetCardGeneration();
        this.tacticalState.resetCardGeneration();
        this.engineerState.resetCardGeneration();
    }

    cleanupAfterEncounter() {
        this.clearCrewCardGeneration();

        for (const system of this.systems.values()) {
            system.cleanupAfterEncounter();
        }
    }

    fullyRepair() {
        for (const system of this.systems.values()) {
            system.fullyRepair();
        }
    }
}

function determineSystemPowerFromReactorCards(cards: UntargetedCardType[]) {
    // Count how many cards of each type the reactor has, as this determines the baseline power each system gets.
    return cards.reduce((counts, cardType) => {
        counts[cardType] = (counts[cardType] || 0) + 1;
        return counts;
    }, {} as Record<UntargetedCardType, number>);
}
