import { type } from '@colyseus/schema';
import { DeflectorEffectDelivery, DeflectorEffectModifier, DeflectorEffectSubstance } from 'common-data/features/cards/types/CardDefinition';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType, EnemyTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { resolveParameters } from 'common-data/features/cards/utils/resolveParameters';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { CrewSystemSetupInfo, ScienceSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import { EngineCardDefinition, EngineDeflectorTargetCardDefinition, EngineEnemyTargetCardDefinition } from 'src/cards/EngineCardDefinition';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { CardState } from 'src/state/CardState';
import { GameState } from 'src/state/GameState';
import { Ship } from 'src/state/Ship';
import { CrewSystemState } from '../CrewSystemState';
import { ScannedEngineerState } from './ScannedEngineerState';
import { ScannedEngineerTileState } from './ScannedEngineerTileState';
import { ScannedHelmState } from './ScannedHelmState';
import { ScannedScienceState } from './ScannedScienceState';
import { ScannedTacticalState } from './ScannedTacticalState';
import { ScannedWeaponSlotState } from './ScannedWeaponSlotState';

export class ScienceState extends CrewSystemState implements ScienceSystemInfo {
    constructor(setup: CrewSystemSetupInfo, gameState: GameState, ship: Ship, getCardId: () => number) {
        super(setup, gameState, ship, getCardId);
        this.deflectorCardId = getCardId();
    }

    private readonly deflectorCardId: number;

    @type(CardState) modifierSlotCard: CardState | null = null;
    @type(CardState) substanceSlotCard: CardState | null = null;
    @type(CardState) deliverySlotCard: CardState | null = null;

    @type(CardState) deflectorCard: CardState | null = null;

    @type(ScannedHelmState) scannedHelm: ScannedHelmState | null = null;
    @type(ScannedTacticalState) scannedTactical: ScannedTacticalState | null = null;
    @type(ScannedScienceState) scannedScience: ScannedScienceState | null = null;
    @type(ScannedEngineerState) scannedEngineer: ScannedEngineerState | null = null;

    private _scannedHelmShip: Ship | null = null;
    private _scannedTacticalShip: Ship | null = null;
    private _scannedScienceShip: Ship | null = null;
    private _scannedEngineerShip: Ship | null = null;

    /**
     * Unsubscribe from all scans targeting the given ship, e.g. when it goes out of range or is destroyed.
     */
    unsubscribeFromShip(targetId: string): void {
        if (this._scannedHelmShip?.id === targetId) {
            this.unsubscribeFromHelm();
        }
        if (this._scannedTacticalShip?.id === targetId) {
            this.unsubscribeFromTactical();
        }
        if (this._scannedScienceShip?.id === targetId) {
            this.unsubscribeFromScience();
        }
        if (this._scannedEngineerShip?.id === targetId) {
            this.unsubscribeFromEngineer();
        }
    }

    /**
     * Subscribe to live updates from a system on a target ship.
     * If already scanning the same system type on a different ship, automatically unsubscribes first.
     */
    subscribeToSystem(targetShip: Ship, system: ShipSystem): void {
        switch (system) {
            case 'helm': this.subscribeToHelm(targetShip); break;
            case 'tactical': this.subscribeToTactical(targetShip); break;
            case 'science': this.subscribeToScience(targetShip); break;
            case 'engineer': this.subscribeToEngineer(targetShip); break;
            default:
                console.warn('Cannot scan system: ' + system);
        }
    }

    unsubscribeFromHelm(): void {
        if (this._scannedHelmShip) {
            this._scannedHelmShip.helmState.scienceScanDataChanged.removeListener(this.getShip().id);
            this._scannedHelmShip.helmState.adjustEffectLevel('beingScanned', -1);
            this._scannedHelmShip = null;
        }
        this.scannedHelm = null;
    }

    unsubscribeFromTactical(): void {
        if (this._scannedTacticalShip) {
            this._scannedTacticalShip.tacticalState.scienceScanDataChanged.removeListener(this.getShip().id);
            this._scannedTacticalShip.tacticalState.adjustEffectLevel('beingScanned', -1);
            this._scannedTacticalShip = null;
        }
        this.scannedTactical = null;
    }

    unsubscribeFromScience(): void {
        if (this._scannedScienceShip) {
            this._scannedScienceShip.scienceState.scienceScanDataChanged.removeListener(this.getShip().id);
            this._scannedScienceShip.scienceState.adjustEffectLevel('beingScanned', -1);
            this._scannedScienceShip = null;
        }
        this.scannedScience = null;
    }

    unsubscribeFromEngineer(): void {
        if (this._scannedEngineerShip) {
            const myId = this.getShip().id;
            for (const tile of this._scannedEngineerShip.engineerState.systems) {
                tile.scienceScanDataChanged.removeListener(myId);
            }
            this._scannedEngineerShip.engineerState.adjustEffectLevel('beingScanned', -1);
            this._scannedEngineerShip = null;
        }
        this.scannedEngineer = null;
    }

    private subscribeToHelm(targetShip: Ship): void {
        this.unsubscribeFromHelm();
        const source = targetShip.helmState;
        const state = new ScannedHelmState();
        state.targetId = targetShip.id;
        this.copyHelmData(state, source);
        source.scienceScanDataChanged.addListener(
            this.getShip().id, false,
            () => {
                this.copyHelmData(this.scannedHelm!, source);
            }
        );
        this._scannedHelmShip = targetShip;
        this.scannedHelm = state;
        targetShip.helmState.adjustEffectLevel('beingScanned', 1);
    }

    private subscribeToTactical(targetShip: Ship): void {
        this.unsubscribeFromTactical();
        const source = targetShip.tacticalState;
        const state = new ScannedTacticalState();
        state.targetId = targetShip.id;
        this.copyTacticalData(state, source);
        source.scienceScanDataChanged.addListener(
            this.getShip().id, false,
            () => {
                this.copyTacticalData(this.scannedTactical!, source);
            }
        );
        this._scannedTacticalShip = targetShip;
        this.scannedTactical = state;
        targetShip.tacticalState.adjustEffectLevel('beingScanned', 1);
    }

    private subscribeToScience(targetShip: Ship): void {
        this.unsubscribeFromScience();
        const source = targetShip.scienceState;
        const state = new ScannedScienceState();
        state.targetId = targetShip.id;
        this.copyScienceData(state, source);
        source.scienceScanDataChanged.addListener(
            this.getShip().id, false,
            () => {
                this.copyScienceData(this.scannedScience!, source);
            }
        );
        this._scannedScienceShip = targetShip;
        this.scannedScience = state;
        targetShip.scienceState.adjustEffectLevel('beingScanned', 1);
    }

    private subscribeToEngineer(targetShip: Ship): void {
        this.unsubscribeFromEngineer();
        const source = targetShip.engineerState;
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
        this._scannedEngineerShip = targetShip;
        this.scannedEngineer = state;
        targetShip.engineerState.adjustEffectLevel('beingScanned', 1);
    }

    private cloneCard(source: CardState | null | undefined): CardState | null {
        if (!source) {
            return null;
        }
        const card = new CardState(source.id, source.type);
        for (const [key, value] of source.modifiers) {
            card.modifiers.set(key, value);
        }
        return card;
    }

    private copyHelmData(state: ScannedHelmState, source: Ship['helmState']): void {
        state.activeManeuver = this.cloneCard(source.activeManeuver?.card);
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
            dest.card = this.cloneCard(src.card);
            dest.modifiers.clear();
            for (const [key, value] of src.modifiers) {
                dest.modifiers.set(key, value);
            }
        }
    }

    private copyScienceData(state: ScannedScienceState, source: Ship['scienceState']): void {
        state.deflectorCard = this.cloneCard(source.deflectorCard);
    }

    private copyEngineerData(state: ScannedEngineerState, source: Ship['engineerState']): void {
        // Make the tiles be the same length.
        while (state.engineerTiles.length < source.systems.length) {
            state.engineerTiles.push(new ScannedEngineerTileState());
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

        if (!cardDefinition.play(this.getGameState(), this.getShip(), target, parameters)) {
            console.log('deflector card refused to play');
            return null;
        }

        // The main deflector card has been played, and should be expended.
        this.handlePlayedCard(this.deflectorCard, -1, cardDefinition, false);
        this.deflectorCard = null;

        // Cards in deflector slots should be discarded when the deflector is activated.
        if (this.modifierSlotCard) {
            const cardDef = getCardDefinition(this.modifierSlotCard.type);
            this.handlePlayedCard(this.modifierSlotCard, -1, cardDef, false);
            this.modifierSlotCard = null;
        }
        if (this.substanceSlotCard) {
            const cardDef = getCardDefinition(this.substanceSlotCard.type);
            this.handlePlayedCard(this.substanceSlotCard, -1, cardDef, false);
            this.substanceSlotCard = null;
        }
        if (this.deliverySlotCard) {
            const cardDef = getCardDefinition(this.deliverySlotCard.type);
            this.handlePlayedCard(this.deliverySlotCard, -1, cardDef, false);
            this.deliverySlotCard = null;
        }

        return cardDefinition;
    }

    override playCardIntoDeflectorSlot(card: CardState, cardDefinition: EngineDeflectorTargetCardDefinition, targetId: string, parameters: CardParameters): boolean {
        if (cardDefinition.parameters[targetId] === null) {
            console.log(`card cannot be played into the ${targetId} slot`);
            return false;
        }

        type ScienceSlotField = 'modifierSlotCard' | 'substanceSlotCard' | 'deliverySlotCard';
        let slot: ScienceSlotField;

        switch (targetId) {
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
                console.warn('unknown science slot: ' + targetId);
                return false;
        }

        if (!cardDefinition.load(this.getGameState(), this.getShip(), targetId, parameters)) {
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
            ? (getCardDefinition(this.modifierSlotCard.type) as EngineDeflectorTargetCardDefinition).parameters.modifier
            : null;

        const substance = this.substanceSlotCard
            ? (getCardDefinition(this.substanceSlotCard.type) as EngineDeflectorTargetCardDefinition).parameters.substance
            : null;

        const delivery = this.deliverySlotCard
            ? (getCardDefinition(this.deliverySlotCard.type) as EngineDeflectorTargetCardDefinition).parameters.delivery
            : null;

        const cardType = this.determineDeflectorCardType(modifier, substance, delivery);
        this.deflectorCard = cardType !== null ? new CardState(this.deflectorCardId, cardType) : null;
        this.scienceScanDataChanged.trigger();
    }

    private determineDeflectorCardType(
        modifier: DeflectorEffectModifier | null,
        substance: DeflectorEffectSubstance | null,
        delivery: DeflectorEffectDelivery | null
    ): EnemyTargetedCardType | null {
        if (!modifier && !substance && !delivery) {
            return null;
        }

        if (!modifier) {
            modifier = 'Modulated';
        }

        if (!substance) {
            substance = 'Graviton';
        }

        if (!delivery) {
            delivery = 'Wave';
        }

        // TODO: implement all the card types so this can be used
        // return `deflector${modifier}${substance}${delivery}`;

        return 'exampleEnemyTarget';
    }
}
