import { cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { flareDuration } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { playerShipSetup } from 'src/campaign/playerShipSetup';
import { CardState } from 'src/state/CardState';
import { PlayerShip } from 'src/state/PlayerShip';
import { setupGameRoom } from 'src/testUtils';
import { describe, expect, it } from 'vitest';

const rooms = setupGameRoom();

function createShip() {
    const state = rooms.createState();
    const ship = new PlayerShip(state, playerShipSetup);
    state.add(ship);
    ship.startEncounter();

    const tactical = ship.engineerState.systems.find(tile => tile.system === 'tactical')!;
    const isBurning = () => tactical.hasEffect('flareBurning');
    /** Plays a Flare card from tactical, and says whether it was played. */
    const flare = () => {
        const card = new CardState(ship.getCardId(), 'flare');
        ship.tacticalState.addCardToHand(card);
        return ship.tacticalState.playCard(card.id, 'flare', 'no-target', '') !== null;
    };

    return { state, ship, tactical, isBurning, flare };
}

describe('Flare', () => {
    it('costs 2, from tactical', () => {
        expect(cardDefinitions.flare).toMatchObject({ targetType: 'no-target', system: 'tactical', parameters: { cost: 2, duration: flareDuration / 1000 } });
        expect(flareDuration).toBe(8000);
    });

    it('burns on its ship\'s tactical system for 8 seconds', () => {
        const { state, isBurning, flare } = createShip();

        expect(flare()).toBe(true);
        expect(isBurning()).toBe(true);

        state.tick(flareDuration - 100);
        expect(isBurning()).toBe(true);

        state.tick(200);
        expect(isBurning()).toBe(false);
    });

    it('starts its time over if another is launched while it burns', () => {
        const { state, tactical, flare } = createShip();

        flare();
        state.tick(5000);
        flare();

        const burning = tactical.effects.filter(effect => effect.type === 'flareBurning');
        expect(burning).toHaveLength(1);
        expect(burning[0].progress?.endTime).toBe(state.currentTime + flareDuration);
    });

    it('can\'t be launched with tactical running below 2', () => {
        const { ship, tactical, isBurning, flare } = createShip();
        tactical.addEffect('reducedPower', 2);
        expect(ship.tacticalState.powerLevel).toBe(1);

        expect(flare()).toBe(false);
        expect(isBurning()).toBe(false);
    });
});
