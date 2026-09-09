import { IArray } from '@colyseus/react';
import { ArraySchema, Schema, type } from '@colyseus/schema';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { isCrewSystem } from 'common-data/features/ships/types/ShipSystem';
import { LeveledSystemEffectType, NonLeveledSystemEffectType, SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { SystemInfo, SystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getArrayValue } from 'common-data/utils/arrays';
import { EngineCardDefinition, EngineNoTargetCardDefinition, EngineWeaponSlotCardDefinition, EngineScanTargetCardDefinition, EngineWeaponTargetCardDefinition, EngineEnemyTargetCardDefinition, EngineSystemTargetCardDefinition, EngineLocationTargetCardDefinition } from 'src/cards/EngineCardDefinition';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { resolveParameters } from 'src/cards/resolveParameters';
import { InterceptableAction } from 'src/classes/InterceptableAction';
import { InterceptableGetter } from 'src/classes/InterceptableGetter';
import { InterceptableSetter } from 'src/classes/InterceptableSetter';
import { CardState } from '../CardState';
import { GameObject } from '../GameObject';
import { GameState } from '../GameState';
import { SystemEffect } from './engineer/SystemEffect';
import type { Ship } from '../Ship';
import type { EngineerSystemTile } from './engineer/EngineerSystemTile';

/**
 * Maps the reactor's power level to the per-system generation duration (ms).
 */
export const generationDurationByReactorPower = [8_000, 4_000, 2_000, 1_000, 500, 250];

export abstract class SystemState extends Schema implements SystemInfo {
    constructor(
        setup: SystemSetupInfo,
        protected readonly _gameState: GameState,
        protected readonly _ship: Ship,
        cards: CardState[],
        initialHandSize: number
    ) {
        super();

        this.underlyingPowerLevel = this.powerLevel = setup.initialPowerLevel;
        this.maxPowerLevel = setup.maxPowerLevel;

        // The first initialHandSize cards go straight into the hand.
        this.hand = new ArraySchema<CardState>(
            ...cards.slice(0, initialHandSize)
        );

        // All remaining cards form the deck.
        this.deck = new ArraySchema<CardState>(
            ...cards.slice(initialHandSize)
        );

        this.health = this.maxHealth = this.initializeCardPool(cards);
    }

    /** How many cards can be held in the hand at once. */
    abstract readonly maxHandSize: number;

    /**
     * Cards available to play for this system.
     */
    @type([CardState]) hand = new ArraySchema<CardState>();

    /**
     * Cards available to be drawn for this system. Cards are drawn from the front, and discarded to the back.
     */
    @type([CardState]) deck = new ArraySchema<CardState>();

    public getLastDrawnCard(): CardState | null {
        return this.lastDrawnCard;
    }

    private lastDrawnCard: CardState | null = null;

    /**
     * Put a card into the hand. Assumes that there is space, and that it's already been removed from wherever it was before. Does not check for duplicates.
     */
    addCardToHand(card: CardState) {
        this.hand.push(card);
        this.lastDrawnCard = card;
    }

    /**
     * Take card(s) from the front of the deck and add them to the hand.
     */
    draw(number = 1) {
        for (let i = 0; i < number; i++) {
            if (this.hand.length >= this.maxHandSize) {
                break;
            }

            const card = this.deck.shift();

            if (card) {
                this.addCardToHand(card);
            }
        }
    }

    /**
     * Take card(s) from the bottom of the deck and add them to the hand.
     */
    drawFromBottom(number = 1) {
        for (let i = 0; i < number; i++) {
            if (this.hand.length >= this.maxHandSize) {
                break;
            }

            const card = this.deck.pop();

            if (card) {
                this.addCardToHand(card);
            }
        }
    }

    /**
     * Randomly take card(s) from the hand and add them to the end of the deck.
     */
    discard(number = 1) {
        const random = this.getShip().random;

        for (let i = 0; i < number; i++) {
            if (this.hand.length === 0) {
                return;
            }

            const card = random.delete(this.hand as CardState[]);
            this.deck.push(card);
        }
    }

    /** Get the game state this system belongs to. */
    getGameState(): GameState {
        return this._gameState;
    }

    /** Get the ship this system belongs to. */
    getShip(): Ship {
        return this._ship;
    }

    private _linkedEngineerSystemTile?: EngineerSystemTile;

    protected get linkedEngineerSystemTile(): EngineerSystemTile {
        if (this._linkedEngineerSystemTile) {
            return this._linkedEngineerSystemTile;
        } else {
            throw new Error('This system is not linked to an engineer system tile');
        }
    }

    /**
     * Link this system to an EngineerSystemTile so that power, health,
     * and effect changes are automatically propagated.
     */
    linkEngineerSystem(engineerSystem: EngineerSystemTile) {
        this._linkedEngineerSystemTile = engineerSystem;
    }

    private underlyingPowerLevel: number;
    @type('uint8') readonly powerLevel: number;
    maxPowerLevel: number;

    readonly health: number;
    maxHealth: number;

    /**
     * Any attacks targeting this system will have their chance to hit modified by this percentage.
     * TODO: make use of this!
     */
    chanceToHitPercentageModifier: number = 0;

    /**
     * This system's damageable cards, wherever they physically are (hand, deck, or a slot).
     * Cards with the expendable trait are never included: they don't affect health and can't be damaged.
     */
    protected readonly cardPool = new Set<CardState>();

    /**
     * Undamaged pool cards, in the order they'll be damaged next. Cards currently occupying a
     * slot are kept after lastUnslottedIndex, so they're only damaged once every other card already is.
     */
    private readonly damageQueue: CardState[] = [];
    private lastUnslottedIndex = 0;

    /** Damaged pool cards, in the order they'll be repaired next. */
    private readonly repairQueue: CardState[] = [];

    /** Pool cards currently occupying a system-specific slot. */
    private readonly slottedCards = new Set<CardState>();

    /**
     * Populate this system's card pool from its underlying cards (skipping expendable ones),
     * and returning the number of cards in the pool, which is also the max health.
     */
    private initializeCardPool(cards: readonly CardState[]): number {
        for (const card of cards) {
            if (card.hasTrait('expendable')) {
                continue;
            }

            this.cardPool.add(card);
            this.damageQueue.push(card);
        }

        this.lastUnslottedIndex = this.damageQueue.length;

        return this.cardPool.size;
    }

    /**
     * Mark a pool card as occupying a slot, so it's only damaged as a last resort. No-op for
     * cards outside this system's pool (e.g. expendable cards).
     */
    protected markCardSlotted(card: CardState) {
        if (!this.cardPool.has(card) || this.slottedCards.has(card)) {
            return;
        }
        this.slottedCards.add(card);

        const index = this.damageQueue.indexOf(card);
        if (index === -1) {
            // Already damaged (in the repair queue); it'll land in the slotted section once repaired.
            return;
        }

        this.damageQueue.splice(index, 1);
        if (index < this.lastUnslottedIndex) {
            this.lastUnslottedIndex--;
        }
        this.damageQueue.push(card);
    }

    /**
     * Mark a pool card as no longer occupying a slot, randomly repositioning it among the other
     * undamaged cards. No-op for cards outside this system's pool.
     */
    protected markCardUnslotted(card: CardState) {
        if (!this.slottedCards.delete(card)) {
            return;
        }

        const index = this.damageQueue.indexOf(card);
        if (index === -1) {
            // Already damaged (in the repair queue); it'll be randomly positioned once repaired.
            return;
        }

        this.damageQueue.splice(index, 1);
        this.insertUnslotted(card);
    }

    /** Insert a card at a random position among the not-yet-slotted section of the damage queue. */
    private insertUnslotted(card: CardState) {
        const index = this.getGameState().random.getInt(this.lastUnslottedIndex + 1);
        this.damageQueue.splice(index, 0, card);
        this.lastUnslottedIndex++;
    }

    /**
     * Recompute health from the damage queue, and propagate the change to the linked engineer system.
     */
    private syncHealth() {
        (this as { health: number }).health = this.damageQueue.length;
        this.linkedEngineerSystemTile.setHealthFromSystem(this);
    }

    /**
     * Adjust health by randomly damaging (negative) or repairing (positive) that many cards.
     * Slotted cards are only damaged once every other pool card is already damaged.
     */
    adjustHealth(adjustment: number) {
        const amount = Math.round(adjustment);

        if (amount < 0) {
            this.damageCards(-amount);
        } else if (amount > 0) {
            this.repairCards(amount);
        }
    }

    private damageCards(count: number) {
        for (let i = 0; i < count; i++) {
            const card = this.damageQueue.shift();
            if (!card) {
                break;
            }

            if (this.lastUnslottedIndex > 0) {
                this.lastUnslottedIndex--;
            }

            card.damaged = true;
            this.getGameState().random.insert(this.repairQueue, card);
        }

        this.syncHealth();
    }

    private repairCards(count: number) {
        for (let i = 0; i < count; i++) {
            const card = this.repairQueue.shift();
            if (!card) {
                break;
            }

            card.damaged = false;

            if (this.slottedCards.has(card)) {
                this.damageQueue.push(card);
            } else {
                this.insertUnslotted(card);
            }
        }

        this.syncHealth();
    }

    /**
     * Play a card from the hand by moving it to the end of the deck.
     * Ensures that all requirements are met before playing.
     * Returns the card if found and played, null otherwise.
     */
    playCard(cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string): EngineCardDefinition | null {
        const cardIndex = this.hand.findIndex(card => card.id === cardId);
        if (cardIndex === -1) {
            console.warn('card not found');
            return null;
        }

        const card = this.hand[cardIndex];

        if (card.damaged) {
            return null;
        }

        let cardDefinition = getCardDefinition(card.type);

        if (cardDefinition.targetType === 'choice') {
            if (!cardDefinition.cards.includes(cardType)) {
                console.error('card choice mismatch');
                return null;
            }

            // If playing a choice card and the specified type is one of that card's choices,
            // use that type's definition for the rest of the checks and play.
            cardDefinition = getCardDefinition(cardType);
        } else if (card.type !== cardType) {
            console.error('card type mismatch');
            return null;
        }

        const parameters = resolveParameters(cardDefinition.parameters, card.modifiers);
        const resolvedCost = parameters['cost'];

        if (this.powerLevel < resolvedCost) {
            console.warn('insufficient power to play card');
            return null;
        }

        if (targetType !== cardDefinition.targetType) {
            // Scan cards can also be played directly against an enemy using their play function.
            if (!(cardDefinition.targetType === 'scan' && targetType === 'enemy')) {
                console.error('playing card on incorrect target type');
                return null;
            }
        }

        let played: boolean;
        let slotted: boolean = false;

        if (cardDefinition.targetType === 'no-target') {
            played = this.playNoTargetCard(cardDefinition, parameters);
        } else if (cardDefinition.targetType === 'weapon-slot') {
            played = this.playWeaponSlotCard(cardDefinition, card, targetId, parameters);
            slotted = true;
        } else if (cardDefinition.targetType === 'weapon') {
            played = this.playWeaponCard(cardDefinition, targetId, parameters);
        } else if (cardDefinition.targetType === 'enemy') {
            played = this.playEnemyCard(cardDefinition, targetId, parameters);
        } else if (cardDefinition.targetType === 'scan') {
            const targetIdParts = targetId.split('/');

            if (targetIdParts[0] === 'target') {
                let systemIndex = parseInt(targetIdParts[2]);
                if (targetIdParts.length < 3 || Number.isNaN(systemIndex)) {
                    console.error('unhandled scan card reveal target:' + targetId);
                    return null;
                }
                played = this.playScanCardReveal(cardDefinition, targetIdParts[1], systemIndex, parameters);
            } else if (targetIdParts[0] === 'vuln') {
                const system = targetIdParts[2];
                if (targetIdParts.length < 3 || !isCrewSystem(system)) {
                    console.error('unhandled scan card vulnerability target:' + targetId);
                    return null;
                }
                played = this.playScanCardIdentify(cardDefinition, targetIdParts[1], system, parameters);
            } else if (targetIdParts[0] === 'deflector') {
                if (targetIdParts.length < 2) {
                    console.error('unhandled scan card deflector target:' + targetId);
                    return null;
                }
                played = this.playCardIntoDeflectorSlot(card, cardDefinition, targetIdParts[1], parameters);
                slotted = true;
            } else {
                console.error('unhandled scan card target:' + targetId);
                return null;
            }
        } else if (cardDefinition.targetType === 'system') {
            played = this.playSystemCard(cardDefinition, targetId, parameters);
        } else if (cardDefinition.targetType === 'location') {
            played = this.playLocationCard(card, cardDefinition, targetId, parameters);
            if (played) {
                slotted = true;
            }
        } else {
            console.error(`unhandled card target type: ${cardDefinition.targetType}`);
            return null;
        }

        if (!played) {
            return null;
        }

        this.handlePlayedCard(card, cardIndex, slotted);

        return cardDefinition;
    }

    private playNoTargetCard(cardDefinition: EngineNoTargetCardDefinition, parameters: CardParameters): boolean {
        if (!cardDefinition.play(this.getGameState(), this.getShip(), parameters)) {
            console.log('card refused to play');
            return false;
        }
        return true;
    }

    protected playWeaponSlotCard(_cardDefinition: EngineWeaponSlotCardDefinition, _card: CardState, _targetId: string, _parameters: CardParameters): boolean {
        console.warn('non-tactical system trying to play weapon slot card');
        return false;
    }

    protected playScanCardReveal(_cardDefinition: EngineScanTargetCardDefinition, _targetId: string, _systemIndex: number, _parameters: CardParameters): boolean {
        console.warn('non-science system trying to play scan card');
        return false;
    }

    protected playScanCardIdentify(_cardDefinition: EngineScanTargetCardDefinition, _targetId: string, _system: CrewRoleName, _parameters: CardParameters): boolean {
        console.warn('non-science system trying to play scan card');
        return false;
    }

    protected playCardIntoDeflectorSlot(_card: CardState, _cardDefinition: EngineScanTargetCardDefinition, _slotId: string, _parameters: CardParameters): boolean {
        console.warn('non-science system trying to play deflector slot card');
        return false;
    }

    protected playWeaponCard(_cardDefinition: EngineWeaponTargetCardDefinition, _targetId: string, _parameters: CardParameters): boolean {
        console.warn('non-tactical system trying to play weapon card');
        return false;
    }

    protected playEnemyCard(cardDefinition: EngineEnemyTargetCardDefinition, targetId: string, parameters: CardParameters): boolean {
        const target = this.resolveTarget(targetId);

        if (!target) {
            console.warn('target not found: ' + targetId);
            return false;
        }

        if (!cardDefinition.play(this.getGameState(), this.getShip(), target, null, parameters)) {
            console.log('card refused to play');
            return false;
        }

        return true;
    }

    protected playSystemCard(_cardDefinition: EngineSystemTargetCardDefinition, _targetId: string, _parameters: CardParameters): boolean {
        console.warn('non-engineer system trying to play system card');
        return false;
    }

    protected playLocationCard(_cardInstance: CardState, _cardDefinition: EngineLocationTargetCardDefinition, _targetId: string, _parameters: CardParameters): boolean {
        console.warn('non-helm system trying to play location card');
        return false;
    }

    /**
     * Handle where a played card goes based on its traits.
     * - expendable: Card is destroyed (not added anywhere)
     * - unstable: Card shuffles back into the deck when played, instead of going on the end.
     * - primary: Card returns to hand (if no other primary card in hand), otherwise goes to the deck
     */
    protected handlePlayedCard(card: CardState, cardIndex: number, playedIntoSlot: boolean): void {
        // The "reduced cost of next card" effect should be removed after a card is played.
        this.removeEffect('reducedCardCost', true);

        let removeFromHand = true;
        let addToDeck = true;
        let randomDeckPosition = false;

        if (playedIntoSlot) {
            // If playing into a slot, it leaves the hand
            addToDeck = false;
        } else if (card.hasTrait('primary') && !this.hand.some((handCard) => {
            return handCard.hasTrait('primary') ?? false;
        })) {
            // Primary cards stay in the hand if no other primary card is already there.
            removeFromHand = false;
            addToDeck = false;
        } else if (card.hasTrait('expendable')) {
            // Don't add expendable cards to the deck; they are destroyed.
            addToDeck = false;
        } else if (card.hasTrait('unstable')) {
            // Unstable cards shuffle back into the deck when played.
            addToDeck = true;
            randomDeckPosition = true;
        }

        // Any extra traits are removed from a card when it is played, unless it was going into a slot.
        if (!playedIntoSlot) {
            // Get only the assigned extra traits whose value indicates they should be removed on play.
            const traitsToRemove = Array.from(card.extraTraits)
                .filter(([, removeOnPlay]) => removeOnPlay)
                .map(([trait]) => trait);

            for (const trait of traitsToRemove) {
                card.extraTraits.delete(trait);
            }
        }

        if (removeFromHand) {
            if (cardIndex !== -1) {
                this.hand.splice(cardIndex, 1);
            }
        } else if (cardIndex === -1) {
            // Don't remove it from the hand ... but it's not already there. Probably it's in a slot. Add it back into the hand!
            this.hand.push(card);
        }

        if (addToDeck) {
            if (randomDeckPosition) {
                this.getGameState().random.insert(this.deck, card);
            } else {
                this.deck.push(card);
            }
        }
    }

    resolveTarget(targetId: string): GameObject | null {
        if (!this.getShip().knownObjects.has(targetId)) {
            return null;
        }

        return this.getGameState().objects.get(targetId) || null;
    }

    /**
     * Adjust the power level, keeping it within bounds and propagating the change to the linked engineer system.
     */
    adjustPowerLevel(adjustment: number) {
        // Keep an "underlying" value so that effects that would adjust below 0 or above max can still be tracked and properly reversed when they effect expire.
        this.underlyingPowerLevel += adjustment;

        // The "proper" value is always clamped to within the allowed bounds.
        (this as { powerLevel: number }).powerLevel = Math.max(0, Math.min(this.underlyingPowerLevel, this.maxPowerLevel));

        this.linkedEngineerSystemTile.setPowerLevelFromSystem(this);
    }

    /**
     * Get the effects currently applied to this system.
     */
    getEffects(): IArray<SystemEffect> {
        return this.linkedEngineerSystemTile.effects;
    }

    /**
     * Add an effect to this system.
     */
    addEffect(effectType: NonLeveledSystemEffectType) {
        this.linkedEngineerSystemTile.addEffect(effectType);
    }

    /**
     * Remove a specific effect from this system.
     * Returns true if the effect was found and removed.
     */
    removeEffect(effect: SystemEffectType, early: boolean): boolean {
        return this.linkedEngineerSystemTile.removeEffect(effect, early);
    }

    adjustEffectLevel(effect: LeveledSystemEffectType, adjustment: number | undefined) {
        return this.linkedEngineerSystemTile.adjustEffectLevel(effect, adjustment);
    }

    hasEffect(effectType: SystemEffectType): boolean {
        return this.linkedEngineerSystemTile.hasEffect(effectType);
    }

    get shieldPassThroughModifier(): number {
        return this.linkedEngineerSystemTile.shieldPassThroughModifier;
    }

    /**
     * Get the generation duration for this system, based on the current reactor power level.
     * Update the engineer system's generation progress when any handler changes this.
     */
    public readonly generationDuration = new InterceptableGetter<number>(() => {
        let reactorPower = this.getShip().reactorState.powerLevel;
        return getArrayValue(generationDurationByReactorPower, reactorPower);
    }, () => this.getShip().engineerState.onGenerationDurationChanged());

    /**
     * Generate a card for this system by drawing from the deck,
     * if there is room in the hand.
     */
    public readonly generate = new InterceptableAction(() => {
        this.draw();
    });

    /**
     * Adjust health on account of receiving damage.
     */
    public readonly applyDamage = new InterceptableSetter<number>((amount: number) => {
        this.adjustHealth(-Math.round(amount));
    });

    /**
     * Adjust the cost of every card associated with this system.
     */
    adjustCostOfEveryCard(amount: number) {
        for (const card of this.hand) {
            card.modifyParameter('cost', amount);
        }

        for (const card of this.deck) {
            card.modifyParameter('cost', amount);
        }
    }
}
