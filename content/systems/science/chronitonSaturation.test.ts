import { PlayerShip } from 'engine/state/PlayerShip';
import { setupGameRoom, shipSetup } from 'engine/testUtils';
import { describe, expect, it } from 'vitest';

const rooms = setupGameRoom();

function createShip() {
    const gameState = rooms.createState();
    const baseSetup = shipSetup(undefined);
    const ship = new PlayerShip(gameState, {
        ...baseSetup,
        helm: { ...baseSetup.helm, initialHandSize: 0 },
    });
    gameState.add(ship);
    return ship;
}

describe('chronitonSaturation', () => {
    it('blocks every second scheduled draw, starting with the first', () => {
        const ship = createShip();
        const helm = ship.helmState;
        helm.addEffect('chronitonSaturation');

        expect(helm.scheduledDraw.invoke()).toBe(false);
        expect(helm.hand.length).toBe(0);

        expect(helm.scheduledDraw.invoke()).toBe(true);
        expect(helm.hand.length).toBe(1);

        expect(helm.scheduledDraw.invoke()).toBe(false);
        expect(helm.scheduledDraw.invoke()).toBe(true);
    });

    it('stops blocking draws once removed', () => {
        const ship = createShip();
        const helm = ship.helmState;
        helm.addEffect('chronitonSaturation');
        helm.removeEffect('chronitonSaturation', 'early');

        expect(helm.scheduledDraw.invoke()).toBe(true);
        expect(helm.hand.length).toBe(1);
    });
});
