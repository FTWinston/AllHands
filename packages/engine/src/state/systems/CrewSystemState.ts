import { ArraySchema, type } from '@colyseus/schema';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { CrewSystemSetupInfo, CrewSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import { InterceptableAction } from 'src/classes/InterceptableAction';
import { CardState } from '../CardState';
import { CooldownState } from '../CooldownState';
import { GameState } from '../GameState';
import { SystemState } from './SystemState';
import type { Ship } from '../Ship';

export class CrewSystemState extends SystemState implements CrewSystemInfo {
    constructor(setup: CrewSystemSetupInfo, gameState: GameState, ship: Ship, scannedSystemIndex: number, private getCardId: () => number) {
        const cards = setup.cards.map(cardType => new CardState(getCardId(), cardType));

        super(setup, gameState, ship, cards, setup.initialHandSize);

        this.scannedSystemIndex = scannedSystemIndex;
    }

    /** Emitted whenever state that is relevant to a science scan changes. */
    readonly scienceScanDataChanged = new InterceptableAction();

    /** The index of this system, on a scan display of this ship. */
    readonly scannedSystemIndex: number;

    /** Cards revealed from the draw pile awaiting a player choice; empty when there is none pending. */
    @type([CardState]) pendingDrawChoice = new ArraySchema<CardState>();

    @type(CooldownState) cardGeneration: CooldownState | null = null;

    @type('uint8') override readonly maxHandSize = 5;

    /**
     * Reveal the first `count` cards of the deck as a pending choice. The choice must later be
     * resolved via `resolveDrawChoice`.
     */
    presentDrawChoice(count = 3) {
        this.deck.push(...this.pendingDrawChoice);
        this.pendingDrawChoice.clear();

        for (let i = 0; i < count; i++) {
            const card = this.deck.shift();

            if (card) {
                this.pendingDrawChoice.push(card);
            }
        }
    }

    /**
     * Resolve a pending draw choice: the chosen card goes to the hand, unless it's already full,
     * in which case it returns to the end of the deck along with the rest of the options.
     */
    resolveDrawChoice(cardId: number): boolean {
        const chosenIndex = this.pendingDrawChoice.findIndex(card => card.id === cardId);
        if (chosenIndex === -1) {
            console.warn('chosen card is not part of the pending draw choice');
            return false;
        }

        for (let i = 0; i < this.pendingDrawChoice.length; i++) {
            const card = this.pendingDrawChoice[i];
            if (i === chosenIndex && this.hand.length < this.maxHandSize) {
                this.hand.push(card);
            } else {
                this.deck.push(card);
            }
        }

        this.pendingDrawChoice.clear();

        return true;
    }

    /**
     * Add a new card of the given type to the hand, optionally forceably discarding a random card from the hand if it is full.
     * This card is generated (not part of the system's original pool), so it doesn't count towards max health.
     */
    addCard(cardType: CardType, force: boolean = false) {
        if (this.hand.length >= this.maxHandSize) {
            if (force) {
                // Discard a random card from the hand to make room.
                this.discard(1);
            } else {
                return;
            }
        }

        this.addCardToHand(new CardState(this.getCardId(), cardType));
    }
}
