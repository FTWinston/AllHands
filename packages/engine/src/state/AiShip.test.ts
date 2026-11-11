import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { shipSetup, setupGameRoom } from 'src/testUtils';
import { describe, expect, it, vi } from 'vitest';
import { AiShip, departDelayMs, departDistance } from './AiShip';
import type { GameState } from './GameState';

const rooms = setupGameRoom();
const TICK = 100;

/** A hostile at the origin that never acts, and an AI ship the given distance from it. Neither has any cards to move with. */
function createPair(distance: number, fleeThreshold = 0) {
    const state = rooms.createState();
    state.initFactions([
        { id: 'player' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ], 'player');

    const hostile = new AiShip(state, {
        ...shipSetup('player', 0, 0),
        goal: { type: 'search-and-destroy' },
        skill: 1,
        fleeThreshold: 0,
        priorities: { helm: 0, tactical: 0, science: 0, engineer: 0 },
    });
    const ship = new AiShip(state, { ...shipSetup('raiders', distance, 0), goal: { type: 'search-and-destroy' }, skill: 1, fleeThreshold });
    state.add(hostile);
    state.add(ship);

    return { state, hostile, ship };
}

function run(state: GameState, ms: number) {
    for (let t = 0; t < ms; t += TICK) {
        state.tick(TICK);
    }
}

describe('AiShip departing', () => {
    it('leaves once it has been withdrawing and clear of every hostile for long enough', () => {
        const { state, ship } = createPair(departDistance + 10);
        const remove = vi.spyOn(state, 'remove');
        const effects = vi.spyOn(state, 'broadcastWeaponEffect');

        ship.ai.commander.withdraw();
        run(state, departDelayMs - 1000);
        expect(state.objects.has(ship.id)).toBe(true);

        run(state, 2500);
        expect(state.objects.has(ship.id)).toBe(false);
        expect(remove).toHaveBeenCalledWith(ship, 'departed');
        // It left in one piece, so it jumps to warp from where it was, and nothing explodes.
        expect(effects.mock.calls.map(([effect]) => effect)).toEqual([
            expect.objectContaining({ type: 'warpAway', sourceId: ship.id, appearance: ship.appearance, position: expect.objectContaining({ x: departDistance + 10, y: 0 }) }),
        ]);
    });

    it('stays while a hostile is too close', () => {
        const { state, ship } = createPair(departDistance - 10);

        ship.ai.commander.withdraw();
        run(state, departDelayMs * 3);

        expect(state.objects.has(ship.id)).toBe(true);
    });

    it('stays while it is not fleeing, however far away it is', () => {
        const { state, ship } = createPair(departDistance + 10);

        run(state, departDelayMs * 3);

        expect(state.objects.has(ship.id)).toBe(true);
    });

    it('leaves when it flees because of damage, too', () => {
        const { state, ship } = createPair(departDistance + 10, 0.4);

        ship.hullState.adjustHealth(-ship.hullState.maxHealth);
        run(state, departDelayMs + 1500);

        expect(state.objects.has(ship.id)).toBe(false);
    });
});
