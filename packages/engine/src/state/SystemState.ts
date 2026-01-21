import { ArraySchema, Schema, type } from '@colyseus/schema';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { SystemInfo, SystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { parseVectors } from 'common-data/features/space/utils/vectors';
import { IRandom } from 'common-data/types/IRandom';
import { getCardDefinition } from '../cards/getEngineCardDefinition';
import { CardState } from './CardState';
import { CooldownState } from './CooldownState';
import { GameState } from './GameState';
import { Ship } from './Ship';

export class SystemState extends Schema implements SystemInfo {
    constructor(setup: SystemSetupInfo, private readonly gameState: GameState, private readonly ship: Ship, getCardId: () => number) {
        super();

        // The first initialHandSize cards go straight into the hand.
        this.hand = new ArraySchema<CardState>(
            ...setup.cards
                .slice(0, setup.initialHandSize)
                .map(cardType => new CardState(getCardId(), cardType))
        );

        // All remianing cards form the draw pile.
        this.drawPile = setup.cards
            .slice(setup.initialHandSize)
            .map(cardType => new CardState(getCardId(), cardType));

        this.discardPile = [];

        this.powerLevel = setup.initialPowerLevel;
        this.maxPowerLevel = setup.maxPowerLevel;
        this.health = setup.health;
        this.maxHealth = setup.maxHealth;
    }

    @type([CardState]) hand: ArraySchema<CardState>;
    drawPile: CardState[];
    discardPile: CardState[];

    @type('number') powerLevel: number;
    maxPowerLevel: number;
    @type('number') health: number;
    maxHealth: number;

    // I'd have liked these to be nullable CooldownState objects,
    // but they're not synchronizing to the client if reassigned.
    // So instead, they're arrays that either have zero or one CooldownState in them.
    // This works, as long as you don't overwrite the item in the array.
    // Instead, clear the array then push a new item if needed.
    @type([CooldownState]) cardGeneration = new ArraySchema<CooldownState>();

    /**
     * Take card(s) from the draw pile and add them to the hand,
     * reshuffling the discard pile into the draw pile if it is exhausted.
     */
    draw(number = 1) {
        for (let i = 0; i < number; i++) {
            let card = this.drawPile.pop();
            if (!card) {
                this.drawPile = this.discardPile;
                this.ship.random.shuffle(this.drawPile);
                this.discardPile = [];
                card = this.drawPile.pop();
            }

            if (card) {
                this.hand.push(card);
            }
        }
    }

    /**
     * Randomly take card(s) from the hand and add them to the discard pile.
     */
    discard(random: IRandom, number = 1) {
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
    playCard(cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string): CardState | null {
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
            if (!cardDefinition.play(this.gameState, this.ship)) {
                console.log('card refused to play');
                return null;
            }
        } else if (cardDefinition.targetType === 'weapon-slot') {
            if (!cardDefinition.play(this.gameState, this.ship, parseInt(targetId))) {
                console.log('card refused to play');
                return null;
            }
        } else if (cardDefinition.targetType === 'weapon') {
            if (!cardDefinition.play(this.gameState, this.ship, parseInt(targetId))) {
                console.log('card refused to play');
                return null;
            }
        } else if (cardDefinition.targetType === 'enemy') {
            if (!cardDefinition.play(this.gameState, this.ship, targetId)) {
                console.log('card refused to play');
                return null;
            }
        } else if (cardDefinition.targetType === 'system') {
            if (!cardDefinition.play(this.gameState, this.ship, parseInt(targetId))) {
                console.log('card refused to play');
                return null;
            }
        } else if (cardDefinition.targetType === 'location') {
            const vectors = parseVectors(targetId);
            if (vectors.length === 0) {
                console.log('invalid location target', targetId);
                return null;
            } else if (!cardDefinition.play(this.gameState, this.ship, cardDefinition.motionData, vectors)) {
                console.log('card refused to play');
                return null;
            }
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            console.error(`unhandled card target type: ${(cardDefinition as any).targetType}`);
            return null;
        }

        this.hand.splice(cardIndex, 1);
        this.discardPile.push(card);

        return card;
    }

    update(currentTime: number) {
        // TODO: card generation is currently a fixed duration, but it should be variable.
        // It should also be able to change part-way through!

        // Generate cards until hand is full (hand size limited by health).
        if (this.hand.length < this.health) {
            if (this.cardGeneration.length === 0) {
                this.cardGeneration.push(new CooldownState(currentTime, currentTime + 5000));
            } else if (this.cardGeneration[0].endTime <= currentTime) {
                this.draw();

                this.cardGeneration.clear();
                if (this.hand.length < this.health) {
                    this.cardGeneration.push(new CooldownState(currentTime, currentTime + 5000));
                }
            }
        } else if (this.cardGeneration.length > 0) {
            // Stop card generation if hand is full.
            this.cardGeneration.clear();
        }
    }
}
