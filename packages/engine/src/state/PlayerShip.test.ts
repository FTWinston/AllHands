import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { PlayerShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { shipSetup, setupGameRoom } from 'src/testUtils';
import { describe, it, expect, vi } from 'vitest';
import { CrewState } from './CrewState';
import { PlayerShip } from './PlayerShip';

const rooms = setupGameRoom();

const cards: CardType[] = ['exampleNoTarget', 'exampleNoTarget', 'exampleNoTarget', 'exampleNoTarget'];
const baseSetup = shipSetup(undefined);
const setup: PlayerShipSetupInfo = {
    ...baseSetup,
    helm: { ...baseSetup.helm, cards },
    science: { ...baseSetup.science, cards },
    tactical: { ...baseSetup.tactical, cards },
};

function createShipWithCrew() {
    const gameState = rooms.createState();
    const ship = new PlayerShip(gameState, setup);
    gameState.add(ship);

    const sendSystemHealthChange = vi.fn();
    ship.crew = { sendSystemHealthChange } as unknown as CrewState;

    return { ship, sendSystemHealthChange };
}

describe('PlayerShip system health changes', () => {
    it('tells the crew when a system is damaged', () => {
        const { ship, sendSystemHealthChange } = createShipWithCrew();

        ship.tacticalState.adjustHealth(-2);

        expect(sendSystemHealthChange).toHaveBeenCalledExactlyOnceWith({ system: 'tactical', change: -2 });
    });

    it('tells the crew when a system is repaired', () => {
        const { ship, sendSystemHealthChange } = createShipWithCrew();
        ship.helmState.adjustHealth(-3);
        sendSystemHealthChange.mockClear();

        ship.helmState.adjustHealth(2);

        expect(sendSystemHealthChange).toHaveBeenCalledExactlyOnceWith({ system: 'helm', change: 2 });
    });

    it('only reports the health that actually changed', () => {
        const { ship, sendSystemHealthChange } = createShipWithCrew();
        ship.scienceState.adjustHealth(-1);
        sendSystemHealthChange.mockClear();

        ship.scienceState.adjustHealth(5);

        expect(sendSystemHealthChange).toHaveBeenCalledExactlyOnceWith({ system: 'science', change: 1 });
    });

    it('says nothing when there is nothing to repair', () => {
        const { ship, sendSystemHealthChange } = createShipWithCrew();

        ship.engineerState.adjustHealth(3);

        expect(sendSystemHealthChange).not.toHaveBeenCalled();
    });
});
