import { ArraySchema, MapSchema, type } from '@colyseus/schema';
import { DeflectorEffectDelivery, DeflectorEffectModifier, DeflectorEffectSubstance } from 'common-data/features/cards/types/CardDefinition';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType, EnemyTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { SectorDestinationInfo } from 'common-data/features/sectors/types/SectorDestinationInfo';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { engineerSystem, helmSystem, scienceSystem, shipSystems, ShipSystem, tacticalSystem } from 'common-data/features/ships/types/ShipSystem';
import { shieldTuningEffects } from 'common-data/features/ships/utils/shieldStats';
import { SystemSetupInfo, ScienceSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import { EngineCardDefinition, EngineScanTargetCardDefinition, EngineEnemyTargetCardDefinition } from 'src/cards/EngineCardDefinition';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { resolveParameters } from 'src/cards/resolveParameters';
import { CardState } from 'src/state/CardState';
import { GameState } from 'src/state/GameState';
import { SectorDestinationState } from 'src/state/SectorDestinationState';
import { Ship } from 'src/state/Ship';
import { CrewSystemState } from '../CrewSystemState';
import { HullSystemTile } from '../engineer/HullSystemTile';
import { ScannedEngineerState } from './ScannedEngineerState';
import { ScannedHelmState } from './ScannedHelmState';
import { ScannedHullState } from './ScannedHullState';
import { ScannedScienceState } from './ScannedScienceState';
import { ScannedSystemOrderState } from './ScannedSystemOrderState';
import { ScannedSystemState } from './ScannedSystemState';
import { ScannedTacticalState } from './ScannedTacticalState';

export class ScienceState extends CrewSystemState implements ScienceSystemInfo {
    constructor(setup: SystemSetupInfo, gameState: GameState, ship: Ship, scannedSystemIndex: number, initialPowerLevel: number, getCardId: () => number) {
        super(setup, 'science', gameState, ship, scannedSystemIndex, initialPowerLevel, getCardId);
        this.deflectorCardId = getCardId();
        this.deflectorCard = new CardState(this.deflectorCardId, this.determineDeflectorCardType(null, null, null));
    }

    private readonly deflectorCardId: number;

    @type(CardState) modifierSlotCard: CardState | null = null;
    @type(CardState) substanceSlotCard: CardState | null = null;
    @type(CardState) deliverySlotCard: CardState | null = null;

    @type(CardState) deflectorCard: CardState;
    @type('string') identifiedVulnerability: EnemyTargetedCardType | null = null;

    @type(ScannedHelmState) scannedHelm: ScannedHelmState | null = null;
    @type(ScannedTacticalState) scannedTactical: ScannedTacticalState | null = null;
    @type(ScannedScienceState) scannedScience: ScannedScienceState | null = null;
    @type(ScannedEngineerState) scannedEngineer: ScannedEngineerState | null = null;

    scannedShip: Ship | null = null;
    @type('string') scannedShipId: string | null = null;

    /**
     * Each ship has a system order, for scanning, so you don't know which is which when you first meet it.
     * This gets copied here as you reveal a system, and retained so that you still know what a system was when it is obscured.
     */
    @type(['uint8']) scannedSystemOrder = new ArraySchema<number>(0, 0, 0, 0);

    /**
     * Persists the identified system layout for each target ship, keyed by ship ID.
     * Retained when a ship goes out of range; cleared only when a ship is destroyed (via forgetShip).
     * Sent to the client so the Science display can show the correct layout for any viewed ship.
     */
    @type({ map: ScannedSystemOrderState }) systemOrderByTarget = new MapSchema<ScannedSystemOrderState>();

    /** Long range sensor readings of the nodes the ship can travel to next; empty except on the sector map. */
    @type([SectorDestinationState]) destinations = new ArraySchema<SectorDestinationState>();

    setDestinations(destinations: readonly SectorDestinationInfo[]) {
        this.destinations.clear();
        this.destinations.push(...destinations.map(destination => new SectorDestinationState(destination)));
    }

    /**
     * Unsubscribe from all scans targeting the given ship, e.g. when it goes out of range or is destroyed.
     */
    unsubscribeFromShip(targetId: string | null = null): void {
        if (targetId === null || this.scannedShip?.id === targetId) {
            this.unsubscribeFromHull();
            this.unsubscribeFromHelm();
            this.unsubscribeFromTactical();
            this.unsubscribeFromScience();
            this.unsubscribeFromEngineer();

            this.scannedShip = null;
            this.scannedShipId = null;
            this.resetScannedSystemOrder();
        }
    }

    /**
     * Called when a ship is destroyed. Stops active scanning and removes all retained knowledge
     * (system order history and tactical vulnerability) for that ship.
     */
    forgetShip(targetId: string): void {
        this.unsubscribeFromShip(targetId);
        this.systemOrderByTarget.delete(targetId);
    }

    /**
     * Subscribe to live updates from a system on a target ship.
     * Automatically unsubscribes from targeting any other ship, optionally also unsubscribes from other systems on the same ship.
     */
    subscribeToSystem(targetShip: Ship, system: ShipSystem): void {
        if (this.scannedShip && this.scannedShip.id !== targetShip.id) {
            this.unsubscribeFromShip();
        } else {
            if (system !== 'helm') {
                this.unsubscribeFromHelm();
            }
            if (system !== 'engineer') {
                this.unsubscribeFromEngineer();
            }
            if (system !== 'science') {
                this.unsubscribeFromScience();
            }
            if (system !== 'tactical') {
                this.unsubscribeFromTactical();
            }
        }

        if (this.scannedShipId !== targetShip.id) {
            this.scannedShip = targetShip;
            this.scannedShipId = targetShip.id;
            this.subscribeToHull(targetShip);
            // Restore previously identified system layout for this ship, or start fresh.
            const history = this.systemOrderByTarget.get(targetShip.id);
            if (history) {
                for (let i = 0; i < this.scannedSystemOrder.length; i++) {
                    this.scannedSystemOrder[i] = history.order[i] ?? 0;
                }
            } else {
                this.resetScannedSystemOrder();
            }
        }

        switch (system) {
            case 'helm':
                this.subscribeToHelm(targetShip);
                break;
            case 'tactical':
                this.subscribeToTactical(targetShip);
                break;
            case 'science':
                this.subscribeToScience(targetShip);
                break;
            case 'engineer':
                this.subscribeToEngineer(targetShip);
                break;
            default:
                console.warn('Cannot scan system: ' + system);
                return;
        }

        this.notifyTacticalSystemKnowledge(targetShip);
    }

    /**
     * Identifies this ship's listener on the scanned ship's hull, which (unlike its systems) science keeps watching until it scans another ship.
     * Science's scan of the target's engineer system also listens to this tile (keyed by this ship's id), so the hull listener needs its own id.
     */
    private get hullListenerId() {
        return `${this.getShip().id}/hull`;
    }

    private unsubscribeFromHull(): void {
        const state = this.getShip().scannedHull;
        if (state.targetId) {
            if (this.scannedShip) {
                getHullTile(this.scannedShip).scienceScanDataChanged.removeListener(this.hullListenerId);
            }

            state.targetId = '';
            state.health = 0;
            state.maxHealth = 0;
            state.shield = 0;
            state.maxShield = 0;
            state.shieldTuning = null;
        }
    }

    private subscribeToHull(targetShip: Ship): void {
        this.unsubscribeFromHull();
        const source = getHullTile(targetShip);
        const state = this.getShip().scannedHull;
        state.targetId = targetShip.id;
        this.copyHullData(state, source);
        source.scienceScanDataChanged.addListener(
            this.hullListenerId,
            () => {
                this.copyHullData(state, source);
            }
        );
    }

    private unsubscribeFromHelm(): void {
        this.scannedHelm?.stopListening();
        this.scannedHelm = null;
    }

    private unsubscribeFromTactical(): void {
        this.scannedTactical?.stopListening();
        this.scannedTactical = null;
    }

    private unsubscribeFromScience(): void {
        this.scannedScience?.stopListening();
        this.scannedScience = null;
    }

    private unsubscribeFromEngineer(): void {
        this.scannedEngineer?.stopListening();
        this.scannedEngineer = null;
    }

    private subscribeToHelm(targetShip: Ship): void {
        this.unsubscribeFromHelm();
        this.scannedHelm = this.startScan(new ScannedHelmState(targetShip.helmState, this.getShip().id), helmSystem);
    }

    private subscribeToTactical(targetShip: Ship): void {
        this.unsubscribeFromTactical();
        this.scannedTactical = this.startScan(new ScannedTacticalState(targetShip.tacticalState, this.getShip().id), tacticalSystem);
    }

    private subscribeToScience(targetShip: Ship): void {
        this.unsubscribeFromScience();
        this.scannedScience = this.startScan(new ScannedScienceState(targetShip.scienceState, this.getShip().id), scienceSystem);
    }

    private subscribeToEngineer(targetShip: Ship): void {
        this.unsubscribeFromEngineer();
        this.scannedEngineer = this.startScan(new ScannedEngineerState(targetShip.engineerState, this.getShip().id), engineerSystem);
    }

    /** Record where the scanned system sits in the target's scan order, and have its scan keep itself up to date. */
    private startScan<T extends ScannedSystemState>(scan: T, systemId: number): T {
        this.updateSystemOrder(scan.targetId, scan.scannedSystemIndex, systemId);
        scan.startListening();
        return scan;
    }

    private notifyTacticalSystemKnowledge(targetShip: Ship): void {
        const shipOrder = this.systemOrderByTarget.get(targetShip.id);
        const identifiedSystems: ShipSystem[] = shipOrder
            ? [...shipOrder.order].filter(v => v !== 0).map(v => shipSystems[v])
            : [];
        this.getShip().tacticalState.setSystemSubTargets(targetShip.id, identifiedSystems);
    }

    /**
     * Engine gap: ArraySchema#fill() is an unimplemented stub in the pinned @colyseus/schema
     * version (throws "not implemented"). Reset the array element-by-element instead, matching
     * the manual copy loop already used above for restoring history.
     */
    private resetScannedSystemOrder(): void {
        for (let i = 0; i < this.scannedSystemOrder.length; i++) {
            this.scannedSystemOrder[i] = 0;
        }
    }

    private updateSystemOrder(targetId: string, scannedSystemIndex: number, systemId: number): void {
        let targetSystemOrder = this.systemOrderByTarget.get(targetId);
        if (!targetSystemOrder) {
            targetSystemOrder = new ScannedSystemOrderState();
            this.systemOrderByTarget.set(targetId, targetSystemOrder);
        }

        targetSystemOrder.order[scannedSystemIndex] = systemId;

        this.scannedSystemOrder[scannedSystemIndex] = systemId;
    }

    private copyHullData(state: ScannedHullState, source: HullSystemTile): void {
        state.health = source.health;
        state.maxHealth = source.maxHealth;
        state.shield = source.shield;
        state.maxShield = source.maxShield;
        state.shieldTuning = shieldTuningEffects.find(tuning => source.hasEffect(tuning)) ?? null;
    }

    public closeScan() {
        this.unsubscribeFromHelm();
        this.unsubscribeFromTactical();
        this.unsubscribeFromScience();
        this.unsubscribeFromEngineer();
    }

    override playCard(cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string): EngineCardDefinition | null {
        // If the deflector card is being played against an enemy, handle it separately, as it's not in the hand.
        if (targetType === 'enemy' && cardId === this.deflectorCardId && this.deflectorCard !== null) {
            return this.playDeflectorCard(targetId);
        }

        return super.playCard(cardId, cardType, targetType, targetId);
    }

    private playDeflectorCard(targetId: string): EngineCardDefinition | null {
        if (!this.deflectorCard) {
            return null;
        }

        const cardDefinition = getCardDefinition(this.deflectorCard.type) as EngineEnemyTargetCardDefinition;
        const parameters = resolveParameters(cardDefinition.parameters, this.deflectorCard.modifiers);
        const resolvedCost = parameters['cost'];

        if (this.powerLevel < resolvedCost) {
            console.warn('insufficient power to play deflector card');
            return null;
        }

        const target = this.resolveTarget(targetId);
        if (!target) {
            console.warn('target not found: ' + targetId);
            return null;
        }

        if (!cardDefinition.play(this.getGameState(), this.getShip(), target, null, parameters)) {
            console.log('deflector card refused to play');
            return null;
        }

        const { x, y } = target.getPosition(this.getGameState().currentTime);
        this.getGameState().broadcastWeaponEffect({
            type: 'shot',
            weapon: this.deflectorCard.type,
            sourceId: this.getShip().id,
            targetId: target.id,
            targetPosition: { x, y },
            startTime: this.getGameState().currentTime,
        });

        if (target instanceof Ship) {
            target.deflectorReceived.triggerListeners({ source: this.getShip(), cardType: this.deflectorCard.type as EnemyTargetedCardType });
        }

        // The main deflector card has been played, and should be expended.
        this.handlePlayedCard(this.deflectorCard, -1, false);

        // Cards in deflector slots should be discarded when the deflector is activated.
        this.unmountModifierCard();
        this.unmountSubstanceCard();
        this.unmountDeliveryCard();

        const cardType = this.determineDeflectorCardType(null, null, null);
        this.deflectorCard = new CardState(this.deflectorCardId, cardType, this.deflectorCard.modifiers);

        return cardDefinition;
    }

    /**
     * Load the deflector directly, with nothing in its slots. This is for a ship whose deflector is there to be read by whoever scans it.
     * It lasts until something is played into a slot, or the deflector is used.
     */
    presetDeflector(modifier: DeflectorEffectModifier | null, substance: DeflectorEffectSubstance | null, delivery: DeflectorEffectDelivery | null) {
        const cardType = this.determineDeflectorCardType(modifier, substance, delivery);

        if (this.deflectorCard.type !== cardType) {
            this.deflectorCard = new CardState(this.deflectorCardId, cardType, this.deflectorCard.modifiers);
            this.scienceScanDataChanged.invoke();
        }
    }

    unmountModifierCard() {
        if (this.modifierSlotCard === null) {
            return;
        }
        this.markCardUnslotted(this.modifierSlotCard);
        this.handlePlayedCard(this.modifierSlotCard, -1, false);
        this.modifierSlotCard = null;
    }

    unmountSubstanceCard() {
        if (this.substanceSlotCard === null) {
            return;
        }
        this.markCardUnslotted(this.substanceSlotCard);
        this.handlePlayedCard(this.substanceSlotCard, -1, false);
        this.substanceSlotCard = null;
    }

    unmountDeliveryCard() {
        if (this.deliverySlotCard === null) {
            return;
        }
        this.markCardUnslotted(this.deliverySlotCard);
        this.handlePlayedCard(this.deliverySlotCard, -1, false);
        this.deliverySlotCard = null;
    }

    override playScanCardReveal(cardDefinition: EngineScanTargetCardDefinition, targetId: string, systemIndex: number, parameters: CardParameters): boolean {
        const target = this.resolveTarget(targetId);
        if (!target || !(target instanceof Ship)) {
            console.warn('invalid scan reveal target: ' + targetId);
            return false;
        }

        const crewSystems: Array<[ShipSystem, CrewSystemState]> = [
            ['helm', target.helmState],
            ['science', target.scienceState],
            ['tactical', target.tacticalState],
            ['engineer', target.engineerState],
        ];

        const match = crewSystems.find(([, state]) => state.scannedSystemIndex === systemIndex);
        if (!match) {
            console.warn('no system in scan slot: ' + targetId);
            return false;
        }

        if (!cardDefinition.revealSystem(this.getGameState(), this.getShip(), target, match[0], parameters)) {
            console.log('card refused to play');
            return false;
        }

        return true;
    }

    override playScanCardIdentify(cardDefinition: EngineScanTargetCardDefinition, targetId: string, system: CrewRoleName, parameters: CardParameters): boolean {
        const target = this.resolveTarget(targetId);
        if (!target || !(target instanceof Ship)) {
            console.warn('invalid scan vulnerability target: ' + targetId);
            return false;
        }

        if (!cardDefinition.findVulnerability(this.getGameState(), this.getShip(), target, system, parameters)) {
            console.log('card refused to play');
            return false;
        }

        return true;
    }

    override playScanCardReadHand(targetId: string, system: CrewRoleName): boolean {
        const target = this.resolveTarget(targetId);
        if (!target || !(target instanceof Ship)) {
            console.warn('invalid scan hand target: ' + targetId);
            return false;
        }

        if (!this.readHand(target, system)) {
            console.log('cannot read hand of ' + system);
            return false;
        }

        return true;
    }

    /**
     * Read the hand of a system that science is scanning, so it can see the cards that system will play next.
     * It's only seen while science goes on scanning that system. Returns false if science isn't scanning it, or has already read its hand.
     */
    readHand(target: Ship, system: CrewRoleName): boolean {
        const scanned = this.getScannedSystem(system);
        if (!scanned || scanned.targetId !== target.id) {
            return false;
        }

        return scanned.readHand();
    }

    /** The scan of one of the scanned ship's systems, or null if science isn't scanning that system. */
    private getScannedSystem(system: CrewRoleName): ScannedSystemState | null {
        switch (system) {
            case 'helm':
                return this.scannedHelm;
            case 'tactical':
                return this.scannedTactical;
            case 'science':
                return this.scannedScience;
            case 'engineer':
                return this.scannedEngineer;
        }
    }

    findVulnerability(_target: Ship, _targetSystem: ShipSystem) {
        // TODO: actually identify a vulnerability on the target system, indicate what exposing it will do
        this.identifiedVulnerability = 'deflectorPhasedGravitonBurst';
    }

    override playCardIntoDeflectorSlot(card: CardState, cardDefinition: EngineScanTargetCardDefinition, slotId: string, parameters: CardParameters): boolean {
        if (cardDefinition.parameters[slotId] === null) {
            console.log(`card cannot be played into the ${slotId} slot`);
            return false;
        }

        type ScienceSlotField = 'modifierSlotCard' | 'substanceSlotCard' | 'deliverySlotCard';
        let slot: ScienceSlotField;

        switch (slotId) {
            case 'modifier':
                slot = 'modifierSlotCard';
                break;
            case 'substance':
                slot = 'substanceSlotCard';
                break;
            case 'delivery':
                slot = 'deliverySlotCard';
                break;
            default:
                console.warn('unknown science slot: ' + slotId);
                return false;
        }

        if (!cardDefinition.load(this.getGameState(), this.getShip(), slotId, parameters)) {
            console.log('card refused to load');
            return false;
        }

        const previousCard = this[slot];
        if (previousCard) {
            // Return the displaced card to the hand.
            this.markCardUnslotted(previousCard);
            this.hand.push(previousCard);
            this.handChanged();
        }

        this[slot] = card;
        this.markCardSlotted(card);
        this.updateDeflectorCard();
        return true;
    }

    private updateDeflectorCard(): void {
        const modifier = this.modifierSlotCard
            ? (getCardDefinition(this.modifierSlotCard.type) as EngineScanTargetCardDefinition).deflectorModifier
            : null;

        const substance = this.substanceSlotCard
            ? (getCardDefinition(this.substanceSlotCard.type) as EngineScanTargetCardDefinition).deflectorSubstance
            : null;

        const delivery = this.deliverySlotCard
            ? (getCardDefinition(this.deliverySlotCard.type) as EngineScanTargetCardDefinition).deflectorDelivery
            : null;

        const cardType = this.determineDeflectorCardType(modifier, substance, delivery);
        this.deflectorCard = new CardState(this.deflectorCardId, cardType, this.deflectorCard.modifiers);
        this.scienceScanDataChanged.invoke();
    }

    private determineDeflectorCardType(
        modifier: DeflectorEffectModifier | null | undefined,
        substance: DeflectorEffectSubstance | null | undefined,
        delivery: DeflectorEffectDelivery | null | undefined
    ): EnemyTargetedCardType {
        if (!modifier) {
            modifier = 'Modulated';
        }

        if (!substance) {
            substance = 'Graviton';
        }

        if (!delivery) {
            delivery = 'Field';
        }

        return `deflector${modifier}${substance}${delivery}`;
    }

    override adjustCostOfEveryCard(amount: number) {
        super.adjustCostOfEveryCard(amount);

        // Also adjust the cost of the card in the deflector slot.
        this.deflectorCard.modifyParameter('cost', amount);
    }

    cleanupAfterEncounter() {
        this.deliverySlotCard = null;
        this.substanceSlotCard = null;
        this.modifierSlotCard = null;
        this.updateDeflectorCard();
        super.cleanupAfterEncounter();
    }
}

/** The engineer's tile for a ship's hull, which carries its health and its shield effect. */
function getHullTile(ship: Ship): HullSystemTile {
    const tile = ship.engineerState.systems.find(system => system.system === 'hull');
    if (!tile) {
        throw new Error(`Ship ${ship.id} has no hull tile`);
    }
    // EngineerState always creates the hull's tile as a HullSystemTile.
    return tile as HullSystemTile;
}
