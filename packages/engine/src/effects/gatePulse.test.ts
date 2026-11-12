import { gatePulseDuration, systemEffectDefinitions } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { playerShipSetup } from 'src/campaign/playerShipSetup';
import { PlayerShip } from 'src/state/PlayerShip';
import { setupGameRoom } from 'src/testUtils';
import { describe, expect, it } from 'vitest';

const rooms = setupGameRoom();

describe('Gate Pulse', () => {
    it('lasts 4 seconds on the system it lands on, and does nothing to it', () => {
        const state = rooms.createState();
        const ship = new PlayerShip(state, playerShipSetup);
        state.add(ship);
        ship.startEncounter();
        const science = ship.engineerState.systems.find(tile => tile.system === 'science')!;
        const power = ship.scienceState.powerLevel;

        expect(systemEffectDefinitions.gatePulse.duration).toBe(4000);
        expect(science.addEffect('gatePulse')).toBe(true);
        expect(science.hasEffect('gatePulse')).toBe(true);
        expect(ship.scienceState.powerLevel).toBe(power);

        state.tick(gatePulseDuration - 100);
        expect(science.hasEffect('gatePulse')).toBe(true);

        state.tick(200);
        expect(science.hasEffect('gatePulse')).toBe(false);
        expect(ship.scienceState.powerLevel).toBe(power);
    });
});
