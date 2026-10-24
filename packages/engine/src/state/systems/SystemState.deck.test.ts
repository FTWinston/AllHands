import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { PlayerShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { setupGameRoom, shipSetup } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import { CardState } from '../CardState';
import { PlayerShip } from '../PlayerShip';

const rooms = setupGameRoom();

const cards: CardType[] = ['phaserStrip', 'phaserCannon', 'photonTorpedo', 'lowYield', 'highYield'];

function createDeck() {
    const gameState = rooms.createState();
    const baseSetup = shipSetup(undefined);
    const setup: PlayerShipSetupInfo = {
        ...baseSetup,
        tactical: { ...baseSetup.tactical, cards, initialHandSize: 0 },
    };
    const ship = new PlayerShip(gameState, setup);
    gameState.add(ship);

    return { ship, system: ship.tacticalState };
}

function deckTypes(deck: Iterable<{ type: CardType }>) {
    return [...deck].map(card => card.type);
}

describe('SystemState moveDeckCard', () => {
    it('moves a card later in the deck', () => {
        const { system } = createDeck();

        expect(system.moveDeckCard(system.deck[0].id, 3)).toBe(true);

        expect(deckTypes(system.deck)).toEqual(['phaserCannon', 'photonTorpedo', 'lowYield', 'phaserStrip', 'highYield']);
    });

    it('moves a card earlier in the deck', () => {
        const { system } = createDeck();

        expect(system.moveDeckCard(system.deck[4].id, 0)).toBe(true);

        expect(deckTypes(system.deck)).toEqual(['highYield', 'phaserStrip', 'phaserCannon', 'photonTorpedo', 'lowYield']);
    });

    it('keeps the new order once the deck is restored after an encounter', () => {
        const { ship, system } = createDeck();
        system.moveDeckCard(system.deck[4].id, 1);
        const order = deckTypes(system.deck);

        ship.startEncounter();
        system.drawFromTop(2);
        ship.cleanupAfterEncounter();

        expect(deckTypes(system.deck)).toEqual(order);
    });

    it.each([-1, 5, 1.5])('rejects moving to position %s', (toIndex) => {
        const { system } = createDeck();

        expect(system.moveDeckCard(system.deck[0].id, toIndex)).toBe(false);

        expect(deckTypes(system.deck)).toEqual(cards);
    });

    it('rejects cards that are not in the deck', () => {
        const { system } = createDeck();

        expect(system.moveDeckCard(9999, 0)).toBe(false);
    });
});

describe('SystemState removeDeckCard', () => {
    it('removes the card from the deck, lowering health and max health', () => {
        const { system } = createDeck();
        const card = system.deck[1];

        expect(system.removeDeckCard(card.id)).toBe(card);

        expect(deckTypes(system.deck)).toEqual(['phaserStrip', 'photonTorpedo', 'lowYield', 'highYield']);
        expect(system.maxHealth).toBe(4);
        expect(system.health).toBe(4);
    });

    it('does not bring the card back once the deck is restored after an encounter', () => {
        const { ship, system } = createDeck();
        system.removeDeckCard(system.deck[0].id);

        ship.cleanupAfterEncounter();

        expect(deckTypes(system.deck)).toEqual(['phaserCannon', 'photonTorpedo', 'lowYield', 'highYield']);
    });

    it('removes a damaged card without changing health', () => {
        const { system } = createDeck();
        system.adjustHealth(-1);
        expect(system.health).toBe(4);
        const damaged = system.deck.find(card => card.isDamaged)!;

        system.removeDeckCard(damaged.id);

        expect(system.maxHealth).toBe(4);
        expect(system.health).toBe(4);

        // The repair queue no longer holds it.
        system.fullyRepair();
        expect(system.health).toBe(4);
    });

    it('rejects cards that are not in the deck', () => {
        const { system } = createDeck();

        expect(system.removeDeckCard(9999)).toBeNull();
        expect(system.deck.length).toBe(5);
    });
});

describe('SystemState addDeckCard', () => {
    it('adds the card to the bottom of the deck, raising health and max health', () => {
        const { ship, system } = createDeck();

        system.addDeckCard(new CardState(ship.getCardId(), 'rapidFire'));

        expect(deckTypes(system.deck)).toEqual([...cards, 'rapidFire']);
        expect(system.maxHealth).toBe(6);
        expect(system.health).toBe(6);

        ship.cleanupAfterEncounter();
        expect(deckTypes(system.deck)).toEqual([...cards, 'rapidFire']);
    });

    it('does not add expendable cards to the pool', () => {
        const { ship, system } = createDeck();

        system.addDeckCard(CardState.createExpendable('rapidFire', ship.getCardId()));

        expect(system.deck.length).toBe(6);
        expect(system.maxHealth).toBe(5);

        ship.cleanupAfterEncounter();
        expect(deckTypes(system.deck)).toEqual(cards);
    });
});
