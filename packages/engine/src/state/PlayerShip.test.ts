import { UntargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { PlayerShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { shipSetup, setupGameRoom } from 'src/testUtils';
import { describe, it, expect, vi } from 'vitest';
import { CardState } from './CardState';
import { CrewState } from './CrewState';
import { PlayerShip } from './PlayerShip';

const rooms = setupGameRoom();

const cards: UntargetedCardType[] = ['exampleNoTarget', 'exampleNoTarget', 'exampleNoTarget', 'exampleNoTarget'];
const baseSetup = shipSetup(undefined);
const setup: PlayerShipSetupInfo = {
    ...baseSetup,
    hull: { ...baseSetup.hull, cards: [...cards, ...cards] },
    tactical: { ...baseSetup.tactical, cards },
};

function createShipWithCrew() {
    const gameState = rooms.createState();
    const ship = new PlayerShip(gameState, setup);
    gameState.add(ship);

    const sendShipHit = vi.fn();
    ship.crew = { sendShipHit } as unknown as CrewState;

    return { ship, sendShipHit };
}

describe('PlayerShip hits', () => {
    it('tells the crew how much damage got through the shields', () => {
        const { ship, sendShipHit } = createShipWithCrew();

        ship.damage({ amount: 3, traits: [], targetSystem: 'tactical' });

        expect(sendShipHit).toHaveBeenCalledExactlyOnceWith({ damage: 3 });
    });

    it('syncs the damage taken as system health', () => {
        const { ship } = createShipWithCrew();

        ship.damage({ amount: 3, traits: [], targetSystem: 'tactical' });

        // 60% of 3, rounded up, goes to the targeted system, and the rest to the hull.
        expect(ship.tacticalState.health).toBe(ship.tacticalState.maxHealth - 2);
        expect(ship.hullState.health).toBe(ship.hullState.maxHealth - 1);
    });
});

describe('PlayerShip antimatter', () => {
    it('starts with none, and can be added to', () => {
        const { ship } = createShipWithCrew();
        expect(ship.antimatter).toBe(0);

        ship.addAntimatter(10);
        ship.addAntimatter(30);
        ship.addAntimatter(-5);

        expect(ship.antimatter).toBe(40);
    });

    it('only spends antimatter the ship has', () => {
        const { ship } = createShipWithCrew();
        ship.addAntimatter(30);

        expect(ship.trySpendAntimatter(20)).toBe(true);
        expect(ship.antimatter).toBe(10);

        expect(ship.trySpendAntimatter(20)).toBe(false);
        expect(ship.trySpendAntimatter(-5)).toBe(false);
        expect(ship.antimatter).toBe(10);

        expect(ship.trySpendAntimatter(10)).toBe(true);
        expect(ship.antimatter).toBe(0);
    });
});

describe('PlayerShip seen card types', () => {
    function createShipWithDecks() {
        const gameState = rooms.createState();
        const ship = new PlayerShip(gameState, {
            ...setup,
            helm: { ...setup.helm, cards: ['slowAndSteady', 'exampleNoTarget', 'slowAndSteady'] },
            tactical: { ...setup.tactical, cards: ['phaserCannon'] },
        });
        gameState.add(ship);
        return ship;
    }

    it('counts every starting deck card as seen, once each, other than placeholders', () => {
        const ship = createShipWithDecks();

        expect([...ship.seenCardTypes]).toEqual(['slowAndSteady', 'phaserCannon']);
    });

    it('ignores expendable and campaign cards', () => {
        const ship = createShipWithDecks();

        ship.markCardTypesSeen(['warpAway', 'deflectorPhasedAntiprotonBeam', 'reactorPowerHelm', 'flare', 'flare']);

        expect([...ship.seenCardTypes]).toEqual(['slowAndSteady', 'phaserCannon', 'flare']);
    });

    it('sees cards added to a hand', () => {
        const ship = createShipWithDecks();

        ship.helmState.addCard('zigZag');

        expect(ship.seenCardTypes).toContain('zigZag');
    });

    it('sees cards added to a deck', () => {
        const ship = createShipWithDecks();

        ship.engineerState.addDeckCard(new CardState(ship.getCardId(), 'purge'));

        expect(ship.seenCardTypes).toContain('purge');
    });

    it('sees every card offered in a shop', () => {
        const ship = createShipWithDecks();

        ship.tacticalState.stockShop([
            new CardState(ship.getCardId(), 'phaserStrip'),
            new CardState(ship.getCardId(), 'photonTorpedo'),
        ]);

        expect(ship.seenCardTypes).toContain('phaserStrip');
        expect(ship.seenCardTypes).toContain('photonTorpedo');
    });
});
