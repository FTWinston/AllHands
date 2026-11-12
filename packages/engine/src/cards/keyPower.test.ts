import { cardDefinitions, type CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getShopCardTypes } from 'common-data/features/cards/utils/getShopCardTypes';
import { crewRoleNames } from 'common-data/features/ships/types/CrewRole';
import { keyPowerDuration } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { playerShipSetup } from 'src/campaign/playerShipSetup';
import { CardState } from 'src/state/CardState';
import { PlayerShip } from 'src/state/PlayerShip';
import { setupGameRoom } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import type { ShipSystem } from 'common-data/features/ships/types/ShipSystem';

const rooms = setupGameRoom();

function createShip() {
    const state = rooms.createState();
    const ship = new PlayerShip(state, playerShipSetup);
    state.add(ship);
    ship.startEncounter();

    /** Plays an engineer card of this type on a system, and says whether it was played. */
    const play = (cardType: CardType, system: ShipSystem) => {
        const card = new CardState(ship.getCardId(), cardType);
        ship.engineerState.addCardToHand(card);
        return ship.engineerState.playCard(card.id, cardType, 'system', system) !== null;
    };
    const power = () => crewRoleNames.map(role => ship.getCrewSystem(role).powerLevel);

    return { state, ship, play, power };
}

describe('Key Power', () => {
    it('costs 1, and is an engineer card that targets a system', () => {
        expect(cardDefinitions.keyPower).toMatchObject({ targetType: 'system', system: 'engineer', parameters: { cost: 1, powerGain: 1, duration: keyPowerDuration / 1000 } });
        expect(keyPowerDuration).toBe(10_000);
    });

    it('raises a system a level, for 10 seconds', () => {
        const { state, ship, play } = createShip();

        expect(play('keyPower', 'tactical')).toBe(true);
        expect(ship.tacticalState.powerLevel).toBe(4);

        state.tick(keyPowerDuration - 100);
        expect(ship.tacticalState.powerLevel).toBe(4);
        state.tick(200);
        expect(ship.tacticalState.powerLevel).toBe(3);
    });

    it('can be on all four crew systems at once, where Aux Power is only ever on one', () => {
        const aux = createShip();
        for (const role of crewRoleNames) {
            aux.play('auxPower', role);
        }
        expect(aux.power()).toEqual([3, 3, 3, 4]);

        const key = createShip();
        for (const role of crewRoleNames) {
            key.play('keyPower', role);
        }
        expect(key.power()).toEqual([4, 4, 4, 4]);
    });

    it('starts its time over if it\'s played again on a system that has it, rather than adding another level', () => {
        const { state, ship, play } = createShip();
        play('keyPower', 'helm');
        state.tick(6000);

        play('keyPower', 'helm');
        expect(ship.helmState.powerLevel).toBe(4);

        state.tick(keyPowerDuration - 100);
        expect(ship.helmState.powerLevel).toBe(4);
        state.tick(200);
        expect(ship.helmState.powerLevel).toBe(3);
    });

    it('is never on sale, as only the gate\'s keepers hand it out', () => {
        expect(getShopCardTypes('engineer')).not.toContain('keyPower');
    });
});
