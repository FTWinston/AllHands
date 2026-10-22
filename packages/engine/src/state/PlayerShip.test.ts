import { UntargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { PlayerShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { shipSetup, setupGameRoom } from 'src/testUtils';
import { describe, it, expect, vi } from 'vitest';
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
