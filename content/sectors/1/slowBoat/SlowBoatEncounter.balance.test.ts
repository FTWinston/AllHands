import { MotionKeyframe } from 'engine/state/MotionKeyframe';
import { seededRandom, setupGameRoom, startCampaign } from 'engine/testUtils';
import { getHostileShips } from 'engine/utils/shipQueries';
import { describe, expect, it } from 'vitest';
import { marrowScenarioId } from './SlowBoatEncounter.engine';
import type { AiShip } from 'engine/state/AiShip';
import type { GameState } from 'engine/state/GameState';
import type { Ship } from 'engine/state/Ship';
import type { HullSystemTile } from 'engine/state/systems/engineer/HullSystemTile';

const rooms = setupGameRoom();

/** A campaign running Slow Boat, with the clinic ship and the harriers picked out. */
function createSlowBoat(seed = 3) {
    const state = rooms.createState(seededRandom(seed));
    const { campaign, ships } = startCampaign(state);
    campaign.devLoadEncounter('slowBoat');

    const marrow = state.getObjectByScenarioId(marrowScenarioId) as AiShip;

    return { state, ship: ships[0], marrow, harriers: getHostileShips(state) };
}

function getHullTile(ship: Ship) {
    return ship.engineerState.systems.find(tile => tile.system === 'hull') as HullSystemTile;
}

type CrossingOptions = {
    /** Called on every tick, before the game moves on, with what has been said so far. */
    eachTick?: (hails: readonly string[]) => void;
    /** Stop once this is true, if that's before the encounter is over. */
    until?: () => boolean;
};

/** Plays the encounter out, AI and all, noting everything that's said. The room's timers aren't otherwise running, so those are moved on as well. */
function runCrossing(state: GameState, { eachTick, until }: CrossingOptions = {}) {
    const tick = 100;
    const start = state.currentTime;
    const hails: string[] = [];

    for (let elapsed = 0; elapsed < 400_000 && state.encounter!.outcome === null && !until?.(); elapsed += tick) {
        eachTick?.(hails);
        state.tick(tick);

        for (const delayed of [...rooms.getClock().delayed]) {
            if (delayed.active) {
                delayed.tick(tick);
            }
        }

        if (state.hail && state.hail.text !== hails[hails.length - 1]) {
            hails.push(state.hail.text);
        }
    }

    return { hails, seconds: (state.currentTime - start) / 1000 };
}

/** How Slow Boat plays out with the real AI, which says whether it's tuned right, rather than whether it works. */
describe('SlowBoatEncounter balance', () => {
    it('the clinic ship flies its whole route, warning of each turn before it makes it, and is thanked at the end', () => {
        const { state, marrow, harriers } = createSlowBoat();
        const heardAtWaypoint: string[][] = [];

        // Its shields are kept up, so this is only about the flying.
        const { hails, seconds } = runCrossing(state, {
            eachTick: (heard) => {
                marrow.hullState.restoreShields();

                const reached = marrow.ai.commander.waypointsReached;
                if (reached > heardAtWaypoint.length) {
                    heardAtWaypoint.push([...heard]);
                }
            },
        });

        expect(state.encounter!.outcome).toBe('success');
        expect(heardAtWaypoint[0]).toContain('Coming about to port in five.');
        expect(heardAtWaypoint[0]).not.toContain('Coming about to starboard in five.');
        expect(heardAtWaypoint[1]).toContain('Coming about to starboard in five.');
        expect(hails[hails.length - 1]).toContain('Jump point');

        // Long enough to make a plan and change it, short enough for a sector to fit in half an hour.
        expect(seconds).toBeGreaterThan(150);
        expect(seconds).toBeLessThan(260);

        expect(harriers.every(harrier => harrier.ai.commander.isWithdrawing)).toBe(true);
    });

    it.each([7, 11])('a crew that does nothing loses the clinic ship before it gets there (seed %i)', (seed) => {
        const { state } = createSlowBoat(seed);

        const { hails } = runCrossing(state);

        expect(state.encounter!.outcome).toBe('failure');
        // It says its shields are going before it's lost. Not always the last of it, though: the end can come faster than that takes to say.
        expect(hails.some(line => line.startsWith('Shields'))).toBe(true);
    });

    it.each([7, 11])('a crew that stays close with its shields extended gets it there, at the cost of its own shields (seed %i)', (seed) => {
        const { state, ship, marrow } = createSlowBoat(seed);
        const ownShield = ship.hullState.shield;

        runCrossing(state, {
            eachTick: () => {
                // Helm keeps alongside, and the engineer keeps the shields out.
                const position = marrow.getPosition(state.currentTime);
                ship.setMotion(new MotionKeyframe(state.currentTime, position.x, position.y - 2, position.angle));

                if (!ship.hasExtendedShields) {
                    getHullTile(ship).addEffect('shieldsExtended');
                }
            },
        });

        expect(state.encounter!.outcome).toBe('success');
        // Most of them, as that's all the crew did: nobody fired a shot.
        expect(ship.hullState.shield).toBeLessThan(ownShield / 2);
    });
});
