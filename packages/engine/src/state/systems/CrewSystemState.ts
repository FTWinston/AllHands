import { ArraySchema, type } from '@colyseus/schema';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { CrewSystemSetupInfo, CrewSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import { EngineCardDefinition, EngineDeflectorTargetCardDefinition, EngineEnemyTargetCardDefinition, EngineLocationTargetCardDefinition, EngineNoTargetCardDefinition, EngineSystemTargetCardDefinition, EngineWeaponSlotCardDefinition, EngineWeaponTargetCardDefinition } from 'src/cards/EngineCardDefinition';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { resolveParameters } from 'src/cards/resolveParameters';
import { BindableEvent } from 'src/classes/BindableEvent';
import { CardState } from '../CardState';
import { CooldownState } from '../CooldownState';
import { GameObject } from '../GameObject';
import { GameState } from '../GameState';
import { SystemState } from './SystemState';
import type { Ship } from '../Ship';

export class CrewSystemState extends SystemState implements CrewSystemInfo {
    constructor(setup: CrewSystemSetupInfo, gameState: GameState, ship: Ship, scannedSystemIndex: number, private getCardId: () => number) {
        super(setup, gameState, ship);
        this.scannedSystemIndex = scannedSystemIndex;

        this.setMaxHandSize();

        // The first initialHandSize cards go straight into the hand.
        this.hand = new ArraySchema<CardState>(
            ...setup.cards
                .slice(0, setup.initialHandSize)
                .map(cardType => new CardState(getCardId(), cardType))
        );

        // All remaining cards form the draw pile.
        this.drawPile = setup.cards
            .slice(setup.initialHandSize)
            .map(cardType => new CardState(getCardId(), cardType));

        this.drawPileSize = this.drawPile.length;

        this.discardPile = [];
    }

    /** Emitted whenever state that is relevant to a science scan changes. */
    readonly scienceScanDataChanged = new BindableEvent<() => void>();

    /** The index of this system, on a scan display of this ship. */
    readonly scannedSystemIndex: number;

    @type([CardState]) hand: ArraySchema<CardState>;
    @type('uint8') drawPileSize: number;
    drawPile: CardState[];
    discardPile: CardState[];

    @type(CooldownState) cardGeneration: CooldownState | null = null;

    @type('uint8') maxHandSize = 0;

    private setMaxHandSize() {
        // 5 cards max hand size at max health, scaling linearly down to 1 card at 1 health, and 0 at 0.
        this.maxHandSize = Math.ceil(5 * this.health / this.maxHealth);
    }

    override adjustHealth(adjustment: number): void {
        super.adjustHealth(adjustment);

        this.setMaxHandSize();
    }

    /**
     * Take card(s) from the draw pile and add them to the hand,
     * reshuffling the discard pile into the draw pile if it is exhausted.
     */
    draw(number = 1) {
        for (let i = 0; i < number; i++) {
            if (this.hand.length >= this.maxHandSize) {
                break;
            }

            let card = this.drawPile.pop();
            if (!card) {
                this.drawPile = this.discardPile;
                this.getShip().random.shuffle(this.drawPile);
                this.discardPile = [];
                card = this.drawPile.pop();
            }

            if (card) {
                this.hand.push(card);
            }
        }

        this.drawPileSize = this.drawPile.length;
    }

    /**
     * Randomly take card(s) from the hand and add them to the discard pile.
     */
    discard(number = 1) {
        const random = this.getShip().random;

        for (let i = 0; i < number; i++) {
            if (this.hand.length === 0) {
                return;
            }

            const card = random.delete(this.hand as CardState[]);
            this.discardPile.push(card);
        }
    }

    /**
     * Play a card from the hand by moving it to the discard pile.
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
            // Deflector cards can also be played directly against an enemy using their play function.
            if (!(cardDefinition.targetType === 'deflector' && targetType === 'enemy')) {
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
        } else if (cardDefinition.targetType === 'deflector') {
            if (targetType === 'enemy') {
                played = this.playEnemyCard(cardDefinition, targetId, parameters);
            } else {
                played = this.playCardIntoDeflectorSlot(card, cardDefinition, targetId, parameters);
                slotted = true;
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

        this.handlePlayedCard(card, cardIndex, cardDefinition, slotted);

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

    protected playCardIntoDeflectorSlot(_card: CardState, _cardDefinition: EngineDeflectorTargetCardDefinition, _targetId: string, _parameters: CardParameters): boolean {
        console.warn('non-science system trying to play deflector slot card');
        return false;
    }

    protected playWeaponCard(_cardDefinition: EngineWeaponTargetCardDefinition, _targetId: string, _parameters: CardParameters): boolean {
        console.warn('non-tactical system trying to play weapon card');
        return false;
    }

    protected playEnemyCard(cardDefinition: EngineEnemyTargetCardDefinition | EngineDeflectorTargetCardDefinition, targetId: string, parameters: CardParameters): boolean {
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
     * - primary: Card returns to hand (if no other primary card in hand), otherwise goes to discard pile
     */
    protected handlePlayedCard(card: CardState, cardIndex: number, cardDefinition: EngineCardDefinition, playedIntoSlot: boolean): void {
        const traits = cardDefinition.traits ?? [];

        let removeFromHand = true;
        let addToDiscard = true;

        if (playedIntoSlot) {
            // If playing into a slot, it leaves the hand
            addToDiscard = false;
        } else if (traits.includes('primary') && !this.hand.some((handCard) => {
            const handCardDef = getCardDefinition(handCard.type);
            return handCardDef.traits?.includes('primary') ?? false;
        })) {
            // Primary cards stay in the hand if no other primary card is already there.
            removeFromHand = false;
            addToDiscard = false;
        } else if (traits.includes('expendable')) {
            // Don't add expendable cards to the discard pile; they are destroyed.
            addToDiscard = false;
        }

        if (removeFromHand) {
            if (cardIndex !== -1) {
                this.hand.splice(cardIndex, 1);
            }
        } else if (cardIndex === -1) {
            // Don't remove it from the hand ... but it's not already there. Probably it's in a slot. Add it back into the hand!
            this.hand.push(card);
        }

        if (addToDiscard) {
            this.discardPile.push(card);
        }
    }

    resolveTarget(targetId: string): GameObject | null {
        if (!this.getShip().knownObjects.has(targetId)) {
            return null;
        }

        return this.getGameState().objects.get(targetId) || null;
    }

    /**
     * Add a new card of the given type to the hand, optionally forceably discarding a random card from the hand if it is full.
     */
    addCard(cardType: CardType, force: boolean = false) {
        if (this.hand.length >= this.health) {
            if (force) {
                // Discard a random card from the hand to make room.
                this.discard(1);
            } else {
                return;
            }
        }

        const newCard = new CardState(this.getCardId(), cardType);
        this.hand.push(newCard);
    }

    /**
     * Generate a card for this system by drawing from the draw pile,
     * if there is room in the hand.
     */
    override generate = new BindableEvent<() => void>(() => {
        this.draw();
    });
}
