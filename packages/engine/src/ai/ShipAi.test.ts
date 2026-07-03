import { ClockTimer } from '@colyseus/timer';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { AiShip } from 'src/state/AiShip';
import { GameState } from 'src/state/GameState';
import { shipSetup } from 'src/testUtils';
import { IdProvider } from 'src/types/IdProvider';
import { describe, it, expect, vi } from 'vitest';
import { COMMANDER_INTERVAL, OFFICER_INTERVAL } from './ShipAi';

function createAiShip() {
    let nextId = 1;
    const idPool: IdProvider = { getId: () => String(nextId++), releaseId: () => {} };
    const state = new GameState(idPool, new ClockTimer(false));
    state.initFactions([{ id: 'raiders', relations: { player: RelationshipType.Hostile } }, { id: 'player' }], 'player');
    const ship = new AiShip(state, { ...shipSetup('raiders'), goal: { type: 'search-and-destroy' }, skill: 1 });
    state.add(ship);
    return { state, ship };
}

describe('ShipAi scheduling', () => {
    it('runs the commander on its interval and officers on theirs', () => {
        const { ship } = createAiShip();
        const commanderSpy = vi.spyOn(ship.ai.commander, 'update');
        const officerSpies = ship.ai.officers.map(o => vi.spyOn(o, 'think'));

        // Tick through 4 officer intervals in 100ms steps.
        for (let t = 0; t <= OFFICER_INTERVAL * 4; t += 100) {
            ship.tick(100, t);
        }

        const expectedCommanderRuns = Math.floor((OFFICER_INTERVAL * 4) / COMMANDER_INTERVAL);
        expect(commanderSpy.mock.calls.length).toBeGreaterThanOrEqual(expectedCommanderRuns - 1);
        for (const spy of officerSpies) {
            expect(spy.mock.calls.length).toBeGreaterThanOrEqual(3);
            expect(spy.mock.calls.length).toBeLessThanOrEqual(5);
        }
    });

    it('contains an officer that throws instead of killing the tick', () => {
        const { ship } = createAiShip();
        vi.spyOn(ship.ai.officers[0], 'think').mockImplementation(() => {
            throw new Error('boom');
        });
        expect(() => {
            for (let t = 0; t <= OFFICER_INTERVAL * 2; t += 100) {
                ship.tick(100, t);
            }
        }).not.toThrow();
    });

    it('staggers officers so they do not all think on the same tick', () => {
        const { ship } = createAiShip();
        const firstThinkTimes = new Map<string, number>();
        for (const officer of ship.ai.officers) {
            vi.spyOn(officer, 'think').mockImplementation((_bb, currentTime) => {
                if (!firstThinkTimes.has(officer.role)) {
                    firstThinkTimes.set(officer.role, currentTime);
                }
            });
        }
        for (let t = 0; t <= OFFICER_INTERVAL * 2; t += 100) {
            ship.tick(100, t);
        }
        const distinct = new Set(firstThinkTimes.values());
        expect(distinct.size).toBeGreaterThan(1);
    });
});
