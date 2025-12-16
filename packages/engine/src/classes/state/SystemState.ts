import { ArraySchema, Schema, type } from '@colyseus/schema';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { handPriority, powerPriority, SystemInfo, SystemPowerPriority, SystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { IRandom } from 'common-data/types/IRandom';
import { CardState } from './CardState';
import { CooldownState } from './CooldownState';
import { Ship } from './Ship';

export class SystemState extends Schema implements SystemInfo {
    constructor(setup: SystemSetupInfo, private readonly ship: Ship, getCardId: () => number) {
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

        this.energy = setup.energy;
        this.powerLevel = setup.powerLevel;
        this.health = setup.health;
        this.priority = powerPriority;
    }

    @type([CardState]) hand: ArraySchema<CardState>;
    drawPile: CardState[];
    discardPile: CardState[];

    @type('number') energy: number;
    @type('number') powerLevel: number;
    @type('number') health: number;
    @type('number') priority: SystemPowerPriority;

    @type(CooldownState) powerGeneration: CooldownState | null = null;
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
                this.ship.random.shuffle(this.drawPile);
                this.discardPile = [];
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
     * Returns the card if found and played, null otherwise.
     */
    playCard(cardId: number, _targetType: CardTargetType, _targetId: string): CardState | null {
        const cardIndex = this.hand.findIndex(card => card.id === cardId);
        if (cardIndex === -1) {
            return null;
        }

        const card = this.hand[cardIndex];
        this.hand.splice(cardIndex, 1);
        this.discardPile.push(card);

        // TODO: Apply card effects based on targetType and targetId

        return card;
    }

    update(currentTime: number) {
        const toGenerate = this.priority === powerPriority && this.energy < this.powerLevel
            ? powerPriority
            : this.hand.length < this.health
                ? handPriority
                : null;

        // TODO: card and power generation are currently fixed durations, but they should be variable.
        // They should also be able to change part-way through!

        if (toGenerate === handPriority) {
            // If priority is hand, generate cards until hand is full.
            if (this.powerGeneration) {
                this.powerGeneration = null;
            }

            if (this.hand.length < this.health) {
                if (!this.cardGeneration) {
                    this.cardGeneration = new CooldownState(currentTime, currentTime + 5000);
                } else if (this.cardGeneration.endTime <= currentTime) {
                    this.draw();

                    if (this.hand.length < this.health) {
                        this.cardGeneration.startTime = currentTime;
                        this.cardGeneration.endTime = currentTime + 5000;
                    } else {
                        this.cardGeneration = null;
                    }
                }
            }
        } else if (toGenerate === powerPriority) {
            if (this.cardGeneration) {
                this.cardGeneration = null;
            }

            if (this.energy < this.powerLevel) {
                if (!this.powerGeneration) {
                    this.powerGeneration = new CooldownState(currentTime, currentTime + 5000);
                } else if (this.powerGeneration.endTime <= currentTime) {
                    this.energy += 1;

                    if (this.energy < this.powerLevel) {
                        this.powerGeneration.startTime = currentTime;
                        this.powerGeneration.endTime = currentTime + 5000;
                    } else {
                        this.powerGeneration = null;
                    }
                }
            }
        }
    }
}
