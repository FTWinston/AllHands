import { ArraySchema, MapSchema, type } from '@colyseus/schema';
import { DeflectorEffectDelivery, DeflectorEffectModifier, DeflectorEffectSubstance } from 'common-data/features/cards/types/CardDefinition';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType, EnemyTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { engineerSystem, helmSystem, scienceSystem, shipSystems, ShipSystem, tacticalSystem } from 'common-data/features/ships/types/ShipSystem';
import { CrewSystemSetupInfo, ScienceSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import { EngineCardDefinition, EngineScanTargetCardDefinition, EngineEnemyTargetCardDefinition } from 'src/cards/EngineCardDefinition';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { resolveParameters } from 'src/cards/resolveParameters';
import { CardState } from 'src/state/CardState';
import { GameState } from 'src/state/GameState';
import { Ship } from 'src/state/Ship';
import { CrewSystemState } from '../CrewSystemState';
import { ScannedEngineerState } from './ScannedEngineerState';
import { ScannedEngineerTileState } from './ScannedEngineerTileState';
import { ScannedHelmState } from './ScannedHelmState';
import { ScannedScienceState } from './ScannedScienceState';
import { ScannedSystemOrderState } from './ScannedSystemOrderState';
import { ScannedTacticalState } from './ScannedTacticalState';
import { ScannedWeaponSlotState } from './ScannedWeaponSlotState';

export class ScienceState extends CrewSystemState implements ScienceSystemInfo {
    constructor(setup: CrewSystemSetupInfo, gameState: GameState, ship: Ship, scannedSystemIndex: number, getCardId: () => number) {
        super(setup, gameState, ship, scannedSystemIndex, getCardId);
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

    /**
     * Unsubscribe from all scans targeting the given ship, e.g. when it goes out of range or is destroyed.
     */
    unsubscribeFromShip(targetId: string | null = null): void {
        if (targetId === null || this.scannedShip?.id === targetId) {
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
    subscribeToSystem(targetShip: Ship, system: ShipSystem, unsubscribeFromOthers: boolean): void {
        if (this.scannedShip && this.scannedShip.id !== targetShip.id) {
            this.unsubscribeFromShip();
        } else if (unsubscribeFromOthers) {
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

    private unsubscribeFromHelm(): void {
        if (this.scannedHelm) {
            this.scannedHelm = null;

            if (this.scannedShip) {
                this.scannedShip.helmState.scienceScanDataChanged.removeListener(this.getShip().id);
                this.scannedShip.helmState.adjustEffectLevel('beingScanned', -1);
            }
        }
    }

    private unsubscribeFromTactical(): void {
        if (this.scannedTactical) {
            this.scannedTactical = null;

            if (this.scannedShip) {
                this.scannedShip.tacticalState.scienceScanDataChanged.removeListener(this.getShip().id);
                this.scannedShip.tacticalState.adjustEffectLevel('beingScanned', -1);
            }
        }
    }

    private unsubscribeFromScience(): void {
        if (this.scannedScience) {
            this.scannedScience = null;

            if (this.scannedShip) {
                this.scannedShip.scienceState.scienceScanDataChanged.removeListener(this.getShip().id);
                this.scannedShip.scienceState.adjustEffectLevel('beingScanned', -1);
            }
        }
    }

    private unsubscribeFromEngineer(): void {
        if (this.scannedEngineer) {
            this.scannedEngineer = null;

            if (this.scannedShip) {
                const thisShipId = this.getShip().id;

                for (const tile of this.scannedShip.engineerState.systems) {
                    tile.scienceScanDataChanged.removeListener(thisShipId);
                }
                this.scannedShip.engineerState.adjustEffectLevel('beingScanned', -1);
            }
        }
    }

    private subscribeToHelm(targetShip: Ship): void {
        this.unsubscribeFromHelm();
        const source = targetShip.helmState;
        this.updateSystemOrder(targetShip.id, source.scannedSystemIndex, helmSystem);
        const state = new ScannedHelmState();
        state.targetId = targetShip.id;
        this.copyHelmData(state, source);
        source.scienceScanDataChanged.addListener(
            this.getShip().id, false,
            () => {
                this.copyHelmData(this.scannedHelm!, source);
            }
        );
        this.scannedHelm = state;
        targetShip.helmState.adjustEffectLevel('beingScanned', 1);
    }

    private subscribeToTactical(targetShip: Ship): void {
        this.unsubscribeFromTactical();
        const source = targetShip.tacticalState;
        this.updateSystemOrder(targetShip.id, source.scannedSystemIndex, tacticalSystem);
        const state = new ScannedTacticalState();
        state.targetId = targetShip.id;
        this.copyTacticalData(state, source);
        source.scienceScanDataChanged.addListener(
            this.getShip().id, false,
            () => {
                this.copyTacticalData(this.scannedTactical!, source);
            }
        );
        this.scannedTactical = state;
        targetShip.tacticalState.adjustEffectLevel('beingScanned', 1);
    }

    private subscribeToScience(targetShip: Ship): void {
        this.unsubscribeFromScience();
        const source = targetShip.scienceState;
        this.updateSystemOrder(targetShip.id, source.scannedSystemIndex, scienceSystem);
        const state = new ScannedScienceState();
        state.targetId = targetShip.id;
        this.copyScienceData(state, source);
        source.scienceScanDataChanged.addListener(
            this.getShip().id, false,
            () => {
                this.copyScienceData(this.scannedScience!, source);
            }
        );
        this.scannedScience = state;
        targetShip.scienceState.adjustEffectLevel('beingScanned', 1);
    }

    private subscribeToEngineer(targetShip: Ship): void {
        this.unsubscribeFromEngineer();
        const source = targetShip.engineerState;
        this.updateSystemOrder(targetShip.id, source.scannedSystemIndex, engineerSystem);
        const state = new ScannedEngineerState();
        state.targetId = targetShip.id;
        this.copyEngineerData(state, source);
        const myId = this.getShip().id;
        const callback = () => {
            this.copyEngineerData(this.scannedEngineer!, source);
        };
        for (const tile of source.systems) {
            tile.scienceScanDataChanged.addListener(myId, false, callback);
        }
        this.scannedEngineer = state;
        targetShip.engineerState.adjustEffectLevel('beingScanned', 1);
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

    private copyHelmData(state: ScannedHelmState, source: Ship['helmState']): void {
        state.activeManeuver = source.activeManeuver?.card?.cloneCard() ?? null;
        state.evasionChance = source.activeManeuver?.card?.getParameter('evasion') ?? 0;
    }

    private copyTacticalData(state: ScannedTacticalState, source: Ship['tacticalState']): void {
        // Make the slots be the same length.
        while (state.weaponSlots.length < source.slots.length) {
            const src = source.slots[state.weaponSlots.length];
            state.weaponSlots.push(new ScannedWeaponSlotState(src.id));
        }
        while (state.weaponSlots.length > source.slots.length) {
            state.weaponSlots.pop();
        }

        for (let i = 0; i < source.slots.length; i++) {
            const src = source.slots[i];
            const dest = state.weaponSlots[i];
            dest.charge = src.charge;
            dest.card = src.card?.cloneCard() ?? null;
            dest.modifiers.clear();
            for (const [key, value] of src.modifiers) {
                dest.modifiers.set(key, value);
            }
        }
    }

    private copyScienceData(state: ScannedScienceState, source: Ship['scienceState']): void {
        state.deflectorCard = source.deflectorCard.cloneCard() ?? null;
    }

    private copyEngineerData(state: ScannedEngineerState, source: Ship['engineerState']): void {
        // Make the tiles be the same length.
        while (state.engineerTiles.length < source.systems.length) {
            state.engineerTiles.push(new ScannedEngineerTileState('hull'));
        }
        while (state.engineerTiles.length > source.systems.length) {
            state.engineerTiles.pop();
        }

        for (let i = 0; i < source.systems.length; i++) {
            const src = source.systems[i];
            const dest = state.engineerTiles[i];
            dest.system = src.system;
            dest.power = src.power;
            dest.health = src.health;
        }
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

        const targetSystem = null; // TODO: deflector cards never target a specific system, right?

        if (!cardDefinition.play(this.getGameState(), this.getShip(), target, targetSystem, parameters)) {
            console.log('deflector card refused to play');
            return null;
        }

        // The main deflector card has been played, and should be expended.
        this.handlePlayedCard(this.deflectorCard, -1, cardDefinition, false);

        // Cards in deflector slots should be discarded when the deflector is activated.
        this.unmountModifierCard();
        this.unmountSubstanceCard();
        this.unmountDeliveryCard();

        const cardType = this.determineDeflectorCardType(null, null, null);
        this.deflectorCard = new CardState(this.deflectorCardId, cardType);

        return cardDefinition;
    }

    unmountModifierCard() {
        if (this.modifierSlotCard === null) {
            return;
        }
        const cardDef = getCardDefinition(this.modifierSlotCard.type);
        this.handlePlayedCard(this.modifierSlotCard, -1, cardDef, false);
        this.modifierSlotCard = null;
    }

    unmountSubstanceCard() {
        if (this.substanceSlotCard === null) {
            return;
        }
        const cardDef = getCardDefinition(this.substanceSlotCard.type);
        this.handlePlayedCard(this.substanceSlotCard, -1, cardDef, false);
        this.substanceSlotCard = null;
    }

    unmountDeliveryCard() {
        if (this.deliverySlotCard === null) {
            return;
        }
        const cardDef = getCardDefinition(this.deliverySlotCard.type);
        this.handlePlayedCard(this.deliverySlotCard, -1, cardDef, false);
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
            this.hand.push(previousCard);
        }

        this[slot] = card;
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
        this.deflectorCard = new CardState(this.deflectorCardId, cardType);
        this.scienceScanDataChanged.trigger();
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
}
