import { cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { getShopCardTypes } from 'common-data/features/cards/utils/getShopCardTypes';
import { playerShipSetup } from 'engine/campaign/playerShipSetup';
import { CardState } from 'engine/state/CardState';
import { PlayerShip } from 'engine/state/PlayerShip';
import { setupGameRoom } from 'engine/testUtils';
import { describe, expect, it } from 'vitest';
import { runQuietPowerLoss } from './engineer.shared';
import type { ShipSystem } from 'common-data/features/ships/types/ShipSystem';

const rooms = setupGameRoom();

function createShip() {
    const state = rooms.createState();
    const ship = new PlayerShip(state, playerShipSetup);
    state.add(ship);
    ship.startEncounter();

    const card = new CardState(ship.getCardId(), 'runQuiet');
    ship.engineerState.addCardToHand(card);

    const tile = (system: ShipSystem) => ship.engineerState.systems.find(candidate => candidate.system === system)!;
    /** Plays the Run Quiet card on a system, and says whether it was played. It stays in hand, as it's put back each time. */
    const runQuiet = (system: ShipSystem) => {
        const played = ship.engineerState.playCard(card.id, 'runQuiet', 'system', system) !== null;
        if (!ship.engineerState.hand.includes(card)) {
            ship.engineerState.removeCard(card.id);
            ship.engineerState.addCardToHand(card);
        }
        return played;
    };

    return { state, ship, tile, runQuiet };
}

describe('Run Quiet', () => {
    it('costs 1, and is an engineer card that targets a system', () => {
        expect(cardDefinitions.runQuiet).toMatchObject({ targetType: 'system', system: 'engineer', parameters: { cost: 1, powerChange: runQuietPowerLoss } });
        expect(runQuietPowerLoss).toBe(2);
    });

    it('takes 2 power from a system, for as long as it likes, and gives it back when played on it again', () => {
        const { state, ship, tile, runQuiet } = createShip();

        expect(runQuiet('helm')).toBe(true);
        expect(ship.helmState.powerLevel).toBe(1);
        expect(tile('helm').hasEffect('runningQuiet')).toBe(true);
        expect(tile('helm').effects.find(effect => effect.type === 'runningQuiet')!.progress).toBeNull();

        state.currentTime += 600_000;
        state.tick(0);
        expect(ship.helmState.powerLevel).toBe(1);

        expect(runQuiet('helm')).toBe(true);
        expect(ship.helmState.powerLevel).toBe(3);
        expect(tile('helm').hasEffect('runningQuiet')).toBe(false);
    });

    it('works on all six systems, its own included, and an engineer running quiet can still play it', () => {
        const { ship, runQuiet } = createShip();

        for (const system of ['engineer', 'hull', 'reactor', 'helm', 'science', 'tactical'] as const) {
            expect(runQuiet(system)).toBe(true);
            expect(ship.getSystem(system).powerLevel).toBe(1);
        }

        expect(runQuiet('engineer')).toBe(true);
        expect(ship.engineerState.powerLevel).toBe(3);
    });

    it('gives back what it took on a system that was already at 1, which it can only take 1 from', () => {
        const { ship, tile, runQuiet } = createShip();
        tile('science').addEffect('reducedPower', 2);
        expect(ship.scienceState.powerLevel).toBe(1);

        runQuiet('science');
        expect(ship.scienceState.powerLevel).toBe(0);

        runQuiet('science');
        expect(ship.scienceState.powerLevel).toBe(1);
    });

    it('works with a boost on the same system, whichever ends first', () => {
        const { ship, tile, runQuiet } = createShip();

        // Boosted, then quiet: 3 + 1 - 2.
        tile('tactical').addEffect('auxPower');
        runQuiet('tactical');
        expect(ship.tacticalState.powerLevel).toBe(2);

        // The boost runs out while it's quiet, then it's brought back.
        tile('tactical').removeEffect('auxPower', 'expired');
        expect(ship.tacticalState.powerLevel).toBe(1);
        runQuiet('tactical');
        expect(ship.tacticalState.powerLevel).toBe(3);

        // Quiet at 1, pushed below nothing, then boosted and brought back in the other order.
        tile('helm').addEffect('reducedPower', 2);
        runQuiet('helm');
        expect(ship.helmState.powerLevel).toBe(0);
        tile('helm').addEffect('overcharge');
        expect(ship.helmState.powerLevel).toBe(2);
        runQuiet('helm');
        expect(ship.helmState.powerLevel).toBe(4);
        tile('helm').removeEffect('overcharge', 'expired');
        tile('helm').removeEffect('reducedPower', 'expired');
        expect(ship.helmState.powerLevel).toBe(3);
    });

    it('can\'t be played by an engineer with no power', () => {
        const { ship, tile, runQuiet } = createShip();
        tile('engineer').addEffect('reducedPower', 3);

        expect(runQuiet('helm')).toBe(false);
        expect(ship.helmState.powerLevel).toBe(3);
    });

    it('is left behind with the encounter: the system has its power back for the next', () => {
        const { ship, runQuiet } = createShip();
        runQuiet('reactor');
        runQuiet('hull');

        ship.cleanupAfterEncounter();

        expect(ship.reactorState.powerLevel).toBe(3);
        expect(ship.hullState.powerLevel).toBe(3);
    });

    it('can be bought from the engineer\'s shop, as Transfer Power can', () => {
        expect(getShopCardTypes('engineer')).toContain('runQuiet');
    });
});
