import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { AiShip } from 'src/state/AiShip';
import { CardState } from 'src/state/CardState';
import { PlayerShip } from 'src/state/PlayerShip';
import { setupGameRoom, shipSetup } from 'src/testUtils';
import { describe, expect, it } from 'vitest';

const rooms = setupGameRoom();

/**
 * The player's ship at the origin, with a friendly ship, a hostile ship and a neutral ship near it, all of which it knows of, and a far-off hostile ship that it doesn't.
 * Nothing is ticked, so no ship's AI moves it.
 */
function createShips() {
    const state = rooms.createState();
    state.initFactions([
        { id: 'player' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
        { id: 'traders', relations: { player: RelationshipType.Neutral } },
    ], 'player');

    const addPlayerShip = (x: number, y: number) => {
        const { appearance: _a, faction: _f, ...setup } = shipSetup(undefined, x, y);
        const ship = new PlayerShip(state, setup);
        state.add(ship);
        ship.startEncounter();
        return ship;
    };
    const addAiShip = (faction: string, x: number, y: number) => {
        const ship = new AiShip(state, { ...shipSetup(faction, x, y), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(ship);
        return ship;
    };

    const ship = addPlayerShip(0, 0);
    const ally = addPlayerShip(5, 0);
    const raider = addAiShip('raiders', 0, 5);
    const trader = addAiShip('traders', -5, 0);
    const distantRaider = addAiShip('raiders', 10_000, 0);
    ship.updateKnownObjects(state.currentTime);

    const helm = ship.helmState;
    helm.adjustPowerLevel(5);

    /** Puts an Orbit card into the helm's hand and plays it on the ship with the given id. Says whether it was played. */
    const playOrbit = (targetId: string) => {
        const card = new CardState(ship.getCardId(), 'orbit');
        helm.addCardToHand(card);
        const played = helm.playCard(card.id, 'orbit', 'ship', targetId) !== null;
        return { card, played };
    };

    return { state, ship, ally, raider, trader, distantRaider, helm, playOrbit };
}

describe('ship-targeted cards', () => {
    it('play on any other ship the playing ship knows of, when the card takes any', () => {
        for (const target of ['ally', 'raider', 'trader'] as const) {
            const world = createShips();
            const { card, played } = world.playOrbit(world[target].id);
            expect(played).toBe(true);
            expect(world.helm.activeManeuver?.card).toBe(card);
            expect(world.helm.hand.includes(card)).toBe(false);
        }
    });

    it('are refused on the playing ship itself, on ships it doesn\'t know of, and on anything that isn\'t a ship', () => {
        const { ship, distantRaider, helm, playOrbit } = createShips();
        expect(ship.knownObjects.has(distantRaider.id)).toBe(false);

        for (const targetId of [ship.id, distantRaider.id, 'nonexistent', '']) {
            const { card, played } = playOrbit(targetId);
            expect(played).toBe(false);
            expect(helm.activeManeuver).toBeNull();
            expect(helm.hand.includes(card)).toBe(true);
        }
    });

    it('are refused when played as another target type', () => {
        const { raider, helm } = createShips();
        const card = new CardState(1000, 'orbit');
        helm.addCardToHand(card);
        expect(helm.playCard(card.id, 'orbit', 'enemy', raider.id)).toBeNull();
        expect(helm.playCard(card.id, 'orbit', 'location', '0,5')).toBeNull();
        expect(helm.hand.includes(card)).toBe(true);
    });

    it('only take ships with the relationship the card wants', () => {
        const { ship, ally, raider, trader, helm } = createShips();

        expect(helm.resolveShipTarget(raider.id, 'hostile')).toBe(raider);
        expect(helm.resolveShipTarget(ally.id, 'hostile')).toBeNull();
        expect(helm.resolveShipTarget(trader.id, 'hostile')).toBeNull();

        expect(helm.resolveShipTarget(ally.id, 'friendly')).toBe(ally);
        expect(helm.resolveShipTarget(raider.id, 'friendly')).toBeNull();
        expect(helm.resolveShipTarget(trader.id, 'friendly')).toBeNull();

        for (const target of [ally, raider, trader]) {
            expect(helm.resolveShipTarget(target.id, 'any')).toBe(target);
            expect(helm.resolveShipTarget(target.id)).toBe(target);
        }

        for (const relationship of ['hostile', 'friendly', 'any'] as const) {
            expect(helm.resolveShipTarget(ship.id, relationship)).toBeNull();
        }
    });
});
