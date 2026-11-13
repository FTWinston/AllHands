import { cardDefinitions, type CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getShopCardTypes } from 'common-data/features/cards/utils/getShopCardTypes';
import { crewRoleNames, type CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { keyTurnedDuration } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { playerShipSetup } from 'src/campaign/playerShipSetup';
import { CardState } from 'src/state/CardState';
import { PlayerShip } from 'src/state/PlayerShip';
import { setupGameRoom } from 'src/testUtils';
import { describe, expect, it } from 'vitest';

const rooms = setupGameRoom();

const keys: Record<CrewRoleName, CardType> = {
    helm: 'shutdownKeyHelm',
    science: 'shutdownKeyScience',
    tactical: 'shutdownKeyTactical',
    engineer: 'shutdownKeyEngineer',
};

function createShip() {
    const state = rooms.createState();
    const ship = new PlayerShip(state, playerShipSetup);
    state.add(ship);
    ship.startEncounter();

    const tile = (role: CrewRoleName) => ship.engineerState.systems.find(candidate => candidate.system === role)!;
    /** Puts a station's key in its hand and plays it, and says whether it was played. */
    const turn = (role: CrewRoleName) => {
        const card = new CardState(ship.getCardId(), keys[role]);
        const system = ship.getCrewSystem(role);
        system.addCardToHand(card);
        return system.playCard(card.id, keys[role], 'no-target', '') !== null;
    };

    return { state, ship, tile, turn };
}

describe('Shutdown Key', () => {
    it.each(crewRoleNames)('costs 4, and belongs to %s, whose station it is', (role) => {
        expect(cardDefinitions[keys[role]]).toMatchObject({ targetType: 'no-target', system: role, parameters: { cost: 4, duration: keyTurnedDuration / 1000 } });
        expect(keyTurnedDuration).toBe(5000);
    });

    it.each(crewRoleNames)('turns %s\'s key, on its own system and nobody else\'s, for 5 seconds', (role) => {
        const { state, tile, turn } = createShip();
        tile(role).addEffect('auxPower');

        expect(turn(role)).toBe(true);
        for (const other of crewRoleNames) {
            expect(tile(other).hasEffect('keyTurned')).toBe(other === role);
        }

        state.tick(keyTurnedDuration - 100);
        expect(tile(role).hasEffect('keyTurned')).toBe(true);
        state.tick(200);
        expect(tile(role).hasEffect('keyTurned')).toBe(false);
    });

    it('can\'t be turned on a station\'s usual 3 power', () => {
        const { ship, tile, turn } = createShip();
        expect(ship.helmState.powerLevel).toBe(3);

        expect(turn('helm')).toBe(false);
        expect(tile('helm').hasEffect('keyTurned')).toBe(false);
    });

    it('is never on sale, as only the gate\'s keepers hand them out', () => {
        for (const role of crewRoleNames) {
            expect(getShopCardTypes(role)).not.toContain(keys[role]);
        }
    });
});
