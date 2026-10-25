import { ArraySchema, type } from '@colyseus/schema';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { SystemSetupInfo, CrewSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import { EngineCardDefinition } from 'src/cards/EngineCardDefinition';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { InterceptableAction } from 'src/classes/InterceptableAction';
import { CardState } from '../CardState';
import { CooldownState } from '../CooldownState';
import { GameState } from '../GameState';
import { NonEncounterCardState } from '../NonEncounterCardState';
import { SystemState } from './SystemState';
import type { Ship } from '../Ship';

export class CrewSystemState extends SystemState implements CrewSystemInfo {
    constructor(setup: SystemSetupInfo, system: ShipSystem, gameState: GameState, ship: Ship, scannedSystemIndex: number, initialPowerLevel: number, private getCardId: () => number) {
        super(setup, system, gameState, ship, initialPowerLevel, getCardId);

        this.scannedSystemIndex = scannedSystemIndex;
    }

    /** Emitted whenever state that is relevant to a science scan changes. */
    readonly scienceScanDataChanged = new InterceptableAction();

    /** The index of this system, on a scan display of this ship. */
    readonly scannedSystemIndex: number;

    /** Cards revealed from the draw pile awaiting a player choice; empty when there is none pending. */
    @type([CardState]) pendingDrawChoice = new ArraySchema<CardState>();

    @type(CooldownState) cardGeneration: CooldownState | null = null;

    /**
     * Cards shown instead of this system's display while outside an encounter (route cards on the map).
     * Built by the campaign; they are not card definitions and never enter the deck or hand.
     */
    @type([NonEncounterCardState]) nonEncounterCards = new ArraySchema<NonEncounterCardState>();

    /** Cards on sale to this crew member, at a shop station for their role. Stocked on arrival; bought cards are removed. Cleared on leaving. */
    @type([CardState]) shopCards = new ArraySchema<CardState>();

    override readonly maxHandSize = 5;

    /**
     * Stocks this crew member's shop with the given cards, replacing any already on offer.
     * Whether the shop is open is only known to their client, which can close and reopen it while at the station.
     */
    stockShop(cards: readonly CardState[]) {
        this.shopCards.clear();
        this.shopCards.push(...cards);
        this.getShip().markCardTypesSeen(cards.map(card => card.type));
    }

    /** Removes a card from the shop, returning it, or null if the shop doesn't offer that card. Doesn't add it to the deck. */
    takeShopCard(cardId: number): CardState | null {
        const index = this.shopCards.findIndex(card => card.id === cardId);
        if (index === -1) {
            return null;
        }

        const [card] = this.shopCards.splice(index, 1);
        return card;
    }

    removeCard(cardId: number): boolean {
        const index = this.hand.findIndex(card => card.id === cardId);
        if (index === -1) {
            return false;
        }

        this.hand.splice(index, 1);
        return true;
    }

    setNonEncounterCards(cards: readonly NonEncounterCardState[]) {
        this.nonEncounterCards.clear();
        this.nonEncounterCards.push(...cards);
    }

    /** Forget the running card generation timer, so the next update starts a fresh one from the current time. */
    resetCardGeneration() {
        this.cardGeneration = null;
    }

    updateCardGeneration() {
        let currentTime = this.getGameState().currentTime;
        let cardDrawTime = this.getShip().reactorState.getDrawTimeForSystemCard(this.system);

        if (cardDrawTime === null) {
            this.cardGeneration = null;
        } else if (this.cardGeneration && this.cardGeneration.endTime > currentTime) {
            this.cardGeneration.rescaleToEnd(currentTime, cardDrawTime);
        } else {
            // Start from the previous completion time (if any) so the counter restarts without a gap.
            this.cardGeneration = new CooldownState(this.cardGeneration?.endTime ?? currentTime, cardDrawTime);
        }
    }

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
     * Validate that a hand card can be spent to refill a capacity meter (repair, charge): it must be usable,
     * not expendable, and affordable at this system's power level. Does not remove it from the hand.
     */
    protected findCardForCapacity(cardId: number): { card: CardState; cardIndex: number; cost: number; definition: EngineCardDefinition } | null {
        const cardIndex = this.hand.findIndex(card => card.id === cardId);
        if (cardIndex === -1) {
            console.warn('card not found');
            return null;
        }

        const card = this.hand[cardIndex];
        if (card.isDamaged) {
            return null;
        }

        const definition = getCardDefinition(card.type);
        if ((definition.traits ?? []).includes('expendable')) {
            return null;
        }

        const cost = card.getParameter('cost');
        if (this.powerLevel < cost) {
            console.warn('insufficient power to use card');
            return null;
        }

        return { card, cardIndex, cost, definition };
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

    override cleanupAfterEncounter() {
        this.pendingDrawChoice.clear();
        this.shopCards.clear();
        super.cleanupAfterEncounter();
    }
}
