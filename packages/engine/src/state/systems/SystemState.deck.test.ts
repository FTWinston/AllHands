import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { PlayerShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { IRandom } from 'common-data/types/IRandom';
import { seededRandom, setupGameRoom, shipSetup } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import { AiShip } from '../AiShip';
import { CardState } from '../CardState';
import { PlayerShip } from '../PlayerShip';

const rooms = setupGameRoom();

const cards: CardType[] = ['phaserStrip', 'phaserCannon', 'photonTorpedo', 'lowYield', 'highYield'];

function createDeck(random?: IRandom) {
    const gameState = rooms.createState(random);
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

describe('Initial hands', () => {
    it('are not dealt to player ships until an encounter starts', () => {
        const gameState = rooms.createState();
        const baseSetup = shipSetup(undefined);
        const ship = new PlayerShip(gameState, { ...baseSetup, tactical: { ...baseSetup.tactical, cards, initialHandSize: 2 } });

        expect(ship.tacticalState.hand.length).toBe(0);
        expect(deckTypes(ship.tacticalState.deck)).toEqual(cards);

        ship.startEncounter();

        expect(deckTypes(ship.tacticalState.hand)).toEqual(cards.slice(0, 2));
        expect(deckTypes(ship.tacticalState.deck)).toEqual(cards.slice(2));
    });

    it('are dealt to AI ships as they are created, as they only exist within an encounter', () => {
        const gameState = rooms.createState();
        const baseSetup = shipSetup('raiders');
        const ship = new AiShip(gameState, {
            ...baseSetup,
            tactical: { ...baseSetup.tactical, cards, initialHandSize: 2 },
            goal: { type: 'search-and-destroy' },
            skill: 1,
        });

        expect(deckTypes(ship.tacticalState.hand)).toEqual(cards.slice(0, 2));
    });
});

describe('SystemState between encounters', () => {
    it('stabilises damaged cards, but leaves critically damaged ones', () => {
        const { ship, system } = createDeck();
        system.adjustHealth(-2);

        ship.cleanupAfterEncounter();
        expect(system.health).toBe(5);
        expect([...system.deck].filter(card => card.hasTrait('stabilised'))).toHaveLength(2);

        // Damaging the stabilised cards again leaves them critically damaged, which they stay.
        system.adjustHealth(-5);
        ship.cleanupAfterEncounter();

        expect(system.health).toBe(3);
        expect([...system.deck].filter(card => card.hasTrait('critical'))).toHaveLength(2);
    });
});

describe('SystemState damage', () => {
    function damageOrder(random: IRandom) {
        const { system } = createDeck(random);
        const order: CardType[] = [];
        for (let i = 0; i < cards.length; i++) {
            system.adjustHealth(-1);
            order.push(...[...system.deck].filter(card => card.isDamaged && !order.includes(card.type)).map(card => card.type));
        }
        return order;
    }

    it('damages cards in an order the game\'s random picks, not the order they\'re listed and drawn in', () => {
        const reversing = Object.assign(seededRandom(1), { shuffle: (items: unknown[]) => items.reverse() });

        expect(damageOrder(reversing)).toEqual([...cards].reverse());
    });

    it('damages them in a different order from one game to another', () => {
        const orders = new Set([1, 2, 3, 4, 5].map(seed => damageOrder(seededRandom(seed)).join()));

        expect(orders.size).toBeGreaterThan(1);
        expect(orders.has(cards.join())).toBe(false);
    });
});
