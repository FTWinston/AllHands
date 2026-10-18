import { PlayerShip } from 'src/state/PlayerShip';
import { shipSetup, setupGameRoom } from 'src/testUtils';
import { describe, expect, it } from 'vitest';

const rooms = setupGameRoom();

function createMovingShip() {
    const state = rooms.createState();
    const { appearance: _a, faction: _f, ...setup } = shipSetup(undefined, 0, 0);
    setup.helm = { ...setup.helm, cards: ['slowAndSteady'], initialHandSize: 1 };
    const ship = new PlayerShip(state, setup);
    state.add(ship);

    // Already facing +x, so this moves straight there without rotating first.
    const card = ship.helmState.hand[0];
    expect(ship.helmState.playCard(card.id, card.type, 'location', '40,0')).not.toBeNull();
    expect(ship.helmState.activeManeuver).not.toBeNull();

    return { state, ship };
}

describe('HelmState', () => {
    it('slows to a stop over 0.75s when a maneuver is cancelled, starting from where the ship is', () => {
        const { state, ship } = createMovingShip();
        for (let t = 0; t < 10_000; t += 100) {
            state.tick(100);
        }
        const cancelTime = state.currentTime;
        const before = ship.getPosition(cancelTime);
        const uninterrupted = ship.getPosition(cancelTime + 750);
        expect(before.x).toBeGreaterThan(1);

        ship.helmState.cancelActiveManeuver();
        state.tick(0);
        expect(ship.helmState.activeManeuver).toBeNull();

        // No jump at the moment of cancelling.
        const atCancel = ship.getPosition(cancelTime);
        expect(atCancel.x).toBeCloseTo(before.x);
        expect(atCancel.y).toBeCloseTo(before.y);

        // Still drifts forward while slowing, but less far than it would have gone.
        const stopped = ship.getPosition(cancelTime + 750);
        expect(stopped.x).toBeGreaterThan(before.x + 0.1);
        expect(stopped.x).toBeLessThan(uninterrupted.x);

        // Then stays put.
        expect(ship.getPosition(cancelTime + 5000).x).toBeCloseTo(stopped.x);
    });
});
