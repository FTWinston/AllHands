import { ArraySchema, type } from '@colyseus/schema';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { CrewSystemSetupInfo, SystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import { parseVector } from 'common-data/features/space/utils/vectors';
import { EngineCardDefinition } from 'src/cards/EngineCardDefinition';
import { getCardDefinition } from '../cards/getEngineCardDefinition';
import { CardState } from './CardState';
import { CooldownState } from './CooldownState';
import { GameState } from './GameState';
import { SystemState } from './SystemState';
import type { Ship } from './Ship';

export class CrewSystemState extends SystemState implements SystemInfo {
    constructor(setup: CrewSystemSetupInfo, gameState: GameState, ship: Ship, private getCardId: () => number) {
        super(setup, gameState, ship);

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

    @type([CardState]) hand: ArraySchema<CardState>;
    @type('uint8') drawPileSize: number;
    drawPile: CardState[];
    discardPile: CardState[];

    @type(CooldownState) cardGeneration: CooldownState | null = null;

    /**
     * Take card(s) from the draw pile and add them to the hand,
     * reshuffling the discard pile into the draw pile if it is exhausted.
     */
    draw(number = 1) {
        for (let i = 0; i < number; i++) {
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

        if (this.powerLevel < cardDefinition.cost) {
            console.warn('insufficient power to play card');
            return null;
        }

        if (targetType !== cardDefinition.targetType) {
            console.error('playing card on incorrect target type');
            return null;
        }

        if (cardDefinition.targetType === 'no-target') {
            if (!cardDefinition.play(this.getGameState(), this.getShip())) {
                console.log('card refused to play');
                return null;
            }
        } else if (cardDefinition.targetType === 'weapon-slot') {
            if (!cardDefinition.play(this.getGameState(), this.getShip(), parseInt(targetId))) {
                console.log('card refused to play');
                return null;
            }
        } else if (cardDefinition.targetType === 'weapon') {
            if (!cardDefinition.play(this.getGameState(), this.getShip(), parseInt(targetId))) {
                console.log('card refused to play');
                return null;
            }
        } else if (cardDefinition.targetType === 'enemy') {
            if (!cardDefinition.play(this.getGameState(), this.getShip(), targetId)) {
                console.log('card refused to play');
                return null;
            }
        } else if (cardDefinition.targetType === 'system') {
            const systemId = targetId as ShipSystem;
            const systemTile = this.getShip().engineerState.systems.find(s => s.system === systemId);

            if (!systemTile || !cardDefinition.play(this.getGameState(), this.getShip(), systemTile)) {
                console.log('card refused to play');
                return null;
            }
        } else if (cardDefinition.targetType === 'location') {
            const targetVector = parseVector(targetId);
            if (targetVector === null) {
                console.log('invalid location target', targetId);
                return null;
            } else if (!cardDefinition.play(this.getGameState(), this.getShip(), cardDefinition.cost, cardDefinition, targetVector)) {
                console.log('card refused to play');
                return null;
            }
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            console.error(`unhandled card target type: ${(cardDefinition as any).targetType}`);
            return null;
        }

        this.handlePlayedCard(card, cardIndex, cardDefinition);

        return cardDefinition;
    }

    /**
     * Handle where a played card goes based on its traits.
     * - expendable: Card is destroyed (not added anywhere)
     * - primary: Card returns to hand (if no other primary card in hand), otherwise goes to discard pile
     */
    private handlePlayedCard(card: CardState, cardIndex: number, cardDefinition: EngineCardDefinition): void {
        const traits = cardDefinition.traits ?? [];

        let removeFromHand = true;
        let addToDiscard = true;

        if (traits.includes('primary') && !this.hand.some((handCard) => {
            const handCardDef = getCardDefinition(handCard.type);
            return handCardDef.traits?.includes('primary') ?? false;
        })) {
            // Card stays in hand if no other primary card is already there.
            removeFromHand = false;
            addToDiscard = false;
        } else if (traits.includes('expendable')) {
            // Don't add expendable cards to the discard pile; they are destroyed.
            addToDiscard = false;
        }

        if (removeFromHand) {
            this.hand.splice(cardIndex, 1);
        }

        if (addToDiscard) {
            this.discardPile.push(card);
        }
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
    override generate(): void {
        if (this.hand.length < this.health) {
            this.draw();
        }
    }
}
