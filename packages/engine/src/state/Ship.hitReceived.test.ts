import { createShipSetup, type ShipDesign } from 'src/campaign/shipDesigns';
import { setupGameRoom } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import { AiShip } from './AiShip';
import type { GameState } from './GameState';
import type { Damage } from 'common-data/features/space/types/Damage';

const rooms = setupGameRoom();

function createState() {
    const state = rooms.createState();
    state.initFactions([{ id: 'player' }], 'player');
    state.factionRegistry.setEncounterFactions([{ id: 'side' }]);
    return state;
}

/** A ship that never acts. */
function addShip(state: GameState, design: ShipDesign = 'fighter') {
    const ship = new AiShip(state, { ...createShipSetup(design, 'side', { x: 0, y: 0, angle: 0 }), priorities: { helm: 0, tactical: 0, science: 0, engineer: 0 } });
    state.add(ship);
    return ship;
}

/** Every hit the ship hears, with its hull's health as it heard it. */
function listen(ship: AiShip) {
    const heard: { damage: Damage; passedThrough: number; healthThen: number }[] = [];
    ship.hitReceived.addListener('test', ({ damage, passedThrough }) => heard.push({ damage, passedThrough, healthThen: ship.hullState.health }));
    return heard;
}

describe('a ship being hit', () => {
    it('is heard once per hit, with what hit it, who fired, where it landed, and how much got past the shields', () => {
        const state = createState();
        const ship = addShip(state);
        const heard = listen(ship);

        const passedThrough = ship.damage({ amount: 40, traits: ['torpedoWeapon'], targetSystem: 'helm', sourceId: 'shooter' });

        expect(heard).toHaveLength(1);
        expect(heard[0].damage).toMatchObject({ amount: 40, traits: ['torpedoWeapon'], targetSystem: 'helm', sourceId: 'shooter' });
        expect(heard[0].passedThrough).toBe(passedThrough);
        expect(passedThrough).toBeGreaterThan(0);
    });

    it('is heard before any of it is applied', () => {
        const state = createState();
        const ship = addShip(state);
        const heard = listen(ship);
        const health = ship.hullState.health;

        ship.damage({ amount: 60, traits: [], targetSystem: 'hull' });

        expect(heard[0].healthThen).toBe(health);
        expect(ship.hullState.health).toBeLessThan(health);
    });

    it('says which system an unaimed hit landed on', () => {
        const state = createState();
        const ship = addShip(state);
        const heard = listen(ship);

        ship.damage({ amount: 10, traits: ['energyWeapon'] });

        expect(heard[0].damage.targetSystem).toBeDefined();
    });

    it('is heard even when the shields take all of it', () => {
        const state = createState();
        // A clinic ship's shields are fully powered, so they absorb all of a hit.
        const ship = addShip(state, 'clinicShip');
        const heard = listen(ship);

        ship.damage({ amount: 10, traits: ['energyWeapon'], targetSystem: 'hull' });

        expect(heard).toEqual([expect.objectContaining({ passedThrough: 0 })]);
    });

    it('is heard by a hit that destroys the ship', () => {
        const state = createState();
        const ship = addShip(state);
        const heard = listen(ship);
        ship.hullState.adjustHealth(-(ship.hullState.health - 1));

        ship.damage({ amount: 60, traits: [], targetSystem: 'hull' });

        expect(heard).toHaveLength(1);
        expect(state.objects.has(ship.id)).toBe(false);
    });
});
