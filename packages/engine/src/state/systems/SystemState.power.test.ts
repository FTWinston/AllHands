import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { playerShipSetup } from 'src/campaign/playerShipSetup';
import { setupGameRoom } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import { PlayerShip } from '../PlayerShip';

const rooms = setupGameRoom();

function createShip() {
    const state = rooms.createState();
    const ship = new PlayerShip(state, playerShipSetup);
    state.add(ship);
    ship.startEncounter();

    const tile = (system: string) => ship.engineerState.systems.find(candidate => candidate.system === system)!;
    return { state, ship, tile };
}

describe('SystemState power', () => {
    it('goes back to what the reactor gives it once the encounter is over, whatever effects were still on it', () => {
        const { ship, tile } = createShip();

        tile('helm').addEffect('auxPower');
        tile('tactical').addEffect('overcharge');
        tile('science').addEffect('reducedPower', 2);
        expect(ship.helmState.powerLevel).toBe(4);
        expect(ship.tacticalState.powerLevel).toBe(5);
        expect(ship.scienceState.powerLevel).toBe(1);

        ship.cleanupAfterEncounter();

        expect(ship.helmState.powerLevel).toBe(3);
        expect(ship.tacticalState.powerLevel).toBe(3);
        expect(ship.scienceState.powerLevel).toBe(3);
        expect(tile('helm').power).toBe(3);
    });

    it('goes back to what the reactor gives it when it was pushed below nothing, and when it was pushed above the most', () => {
        const { ship, tile } = createShip();

        tile('helm').addEffect('reducedPower', 5);
        tile('tactical').addEffect('divertAllPowerGain', 5);
        expect(ship.helmState.powerLevel).toBe(0);
        expect(ship.tacticalState.powerLevel).toBe(5);

        ship.cleanupAfterEncounter();

        expect(ship.helmState.powerLevel).toBe(3);
        expect(ship.tacticalState.powerLevel).toBe(3);
    });

    it('stays a level down for each of its reactor cards that is damaged for good, and comes back for those that are repaired', () => {
        const { ship } = createShip();
        const helmCards = [...ship.reactorState.deck].filter(card => card.type === 'reactorPowerHelm');
        const critical = helmCards[0];
        critical.addTrait('stabilised', ExtraTraitType.Normal);
        // Damage the stabilised one and another: it's damaged for good, and the other can be repaired.
        ship.reactorState.adjustHealth(-ship.reactorState.health);
        expect(critical.hasTrait('critical')).toBe(true);
        expect(ship.helmState.powerLevel).toBe(0);

        ship.cleanupAfterEncounter();

        expect(ship.helmState.powerLevel).toBe(2);
        expect(ship.hullState.powerLevel).toBe(3);
        expect(ship.engineerState.systems.find(tile => tile.system === 'helm')!.getEffectLevel('reducedPower')).toBe(1);
    });

    it('goes back to what the reactor gives it after a full repair, which clears every effect', () => {
        const { ship, tile } = createShip();

        tile('engineer').addEffect('auxPower');
        ship.fullyRepair();

        expect(ship.engineerState.powerLevel).toBe(3);
    });
});
