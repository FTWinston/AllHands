import { ArraySchema, Schema, type } from '@colyseus/schema';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { powerPriority, SystemInfo, SystemPowerPriority } from 'common-data/features/space/types/GameObjectInfo';
import { IRandom } from 'common-data/types/IRandom';
import { CardState } from './CardState';

export class SystemState extends Schema implements SystemInfo {
    constructor(cards: CardState[]) {
        super();
        this.drawPile = cards;
    }

    @type([CardState]) hand = new ArraySchema<CardState>();
    drawPile: CardState[];
    discardPile: CardState[] = [];

    /**
     * Take card(s) from the draw pile and add them to the hand,
     * reshuffling the discard pile into the draw pile if it is exhausted.
     */
    draw(random: IRandom, number = 1) {
        for (let i = 0; i < number; i++) {
            let card = this.drawPile.pop();
            if (!card) {
                this.drawPile = this.discardPile;
                random.shuffle(this.drawPile);
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

    @type('number') energy: number = 1;
    @type('number') powerLevel: number = 1;
    @type('number') health: number = 1;
    @type('number') priority: SystemPowerPriority = powerPriority;

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
}
