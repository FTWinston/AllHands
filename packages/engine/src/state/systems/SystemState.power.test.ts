import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { shipSystems } from 'common-data/features/ships/types/ShipSystem';
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

    it('takes each effect off through its own handler, so the power it ends with follows whatever the reactor now gives, not what it gave at the start', () => {
        const { ship, tile } = createShip();

        // As if the reactor were changed to give helm another level.
        ship.helmState.adjustPowerLevel(1);
        tile('helm').addEffect('auxPower');
        expect(ship.helmState.powerLevel).toBe(5);

        ship.cleanupAfterEncounter();

        expect(ship.helmState.powerLevel).toBe(4);
    });

    it('doesn\'t move a reduction in power to another system as it clears it', () => {
        const { ship, tile } = createShip();

        tile('science').addEffect('reducedPower', 2);
        ship.cleanupAfterEncounter();

        expect(ship.engineerState.systems.some(candidate => candidate.hasEffect('reducedPower'))).toBe(false);
        for (const system of shipSystems.map(name => ship.getSystem(name))) {
            expect(system.powerLevel).toBe(3);
        }
    });

    it('undoes an effect on the cost of a system\'s cards before the cards are put back', () => {
        const { ship } = createShip();
        const costs = () => [...ship.scienceState.deck, ...ship.scienceState.hand].sort((a, b) => a.id - b.id).map(card => card.getParameter('cost'));
        const before = costs();

        ship.scienceState.addEffect('reducedCardCost');
        ship.cleanupAfterEncounter();

        expect(costs()).toEqual(before);
    });

    it('gives the power back from a reset that\'s under way', () => {
        const { ship, tile } = createShip();

        tile('tactical').addEffect('resetting');
        expect(ship.tacticalState.powerLevel).toBe(0);
        ship.cleanupAfterEncounter();

        expect(ship.tacticalState.powerLevel).toBe(3);
    });

    it('doesn\'t set off a reactor breach that\'s counting down as the encounter ends', () => {
        const { state, ship } = createShip();

        ship.reactorState.adjustHealth(-ship.reactorState.health);
        expect(ship.reactorState.hasEffect('reactorBreach')).toBe(true);
        ship.cleanupAfterEncounter();

        expect(state.objects.has(ship.id)).toBe(true);
    });
});
