import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { IRandom } from 'common-data/types/IRandom';
import { AiShip } from 'src/state/AiShip';
import { MotionKeyframe } from 'src/state/MotionKeyframe';
import { shipSetup, setupGameRoom } from 'src/testUtils';
import { describe, it, expect, vi } from 'vitest';
import { Commander, HULL_FOCUS_CHANCE, PREFER_BONUS } from './Commander';
import { createBlackboard, resolveAiConfig } from './types';

const rooms = setupGameRoom();

function createWorld(random?: IRandom) {
    const state = rooms.createState(random);
    state.initFactions([
        { id: 'player' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ], 'player');
    return state;
}

/** Deterministic IRandom: getFloat always returns 0 (bearing 0 -> wander point at +x). */
function fixedRandom(): IRandom {
    return {
        getFloat: () => 0,
        getBoolean: () => false,
        getInt: () => 0,
        pick: values => values[0],
        insert: (array, value) => {
            (array as unknown as unknown[]).push(value);
        },
        delete: values => (values as unknown as unknown[]).pop() as never,
        shuffle: () => {},
    };
}

/** IRandom that throws if any randomness is consumed — proves a code path is deterministic. */
function throwingRandom(): IRandom {
    return {
        getFloat: () => {
            throw new Error('should not consume randomness on this path');
        },
        getBoolean: () => false,
        getInt: () => 0,
        pick: values => values[0],
        insert: (array, value) => {
            (array as unknown as unknown[]).push(value);
        },
        delete: values => (values as unknown as unknown[]).pop() as never,
        shuffle: () => {},
    };
}

function aiSetup(extra: Partial<Parameters<typeof resolveAiConfig>[0]> = {}) {
    return { ...shipSetup('raiders', 0, 0), goal: { type: 'search-and-destroy' as const }, skill: 1, ...extra };
}

describe('Commander', () => {
    it('targets the nearest known hostile and sets aggressive stance', () => {
        const state = createWorld();
        const ai = new AiShip(state, aiSetup());
        state.add(ai);
        const near = new AiShip(state, { ...shipSetup('player', 5, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        const far = new AiShip(state, { ...shipSetup('player', 50, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(near);
        state.add(far);
        ai.updateKnownObjects(0);

        const bb = createBlackboard({ type: 'search-and-destroy' });
        const commander = new Commander(ai, state, resolveAiConfig(aiSetup() as never));
        commander.update(bb, 0);

        expect(bb.targetId).toBe(near.id);
        expect(bb.stance).toBe('aggressive');
        expect(bb.lastKnownTargetPosition).toEqual(expect.objectContaining({ x: 5, y: 0 }));
    });

    it('keeps the current target unless a challenger is 25% better', () => {
        const state = createWorld();
        const ai = new AiShip(state, aiSetup());
        state.add(ai);
        const a = new AiShip(state, { ...shipSetup('player', 10, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        const b = new AiShip(state, { ...shipSetup('player', 9, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(a);
        state.add(b);
        ai.updateKnownObjects(0);

        const bb = createBlackboard({ type: 'search-and-destroy' });
        const commander = new Commander(ai, state, resolveAiConfig(aiSetup() as never));
        bb.targetId = a.id; // pre-existing engagement
        commander.update(bb, 0);
        expect(bb.targetId).toBe(a.id); // b is only marginally closer — stickiness holds
    });

    it('flees below the threshold and resumes after repair', () => {
        const state = createWorld();
        const ai = new AiShip(state, aiSetup());
        state.add(ai);
        const bb = createBlackboard({ type: 'search-and-destroy' });
        const commander = new Commander(ai, state, resolveAiConfig(aiSetup() as never));

        ai.hullState.adjustHealth(-80); // 20% < 0.25 threshold
        commander.update(bb, 0);
        expect(bb.goal).toBe('flee');
        expect(bb.stance).toBe('withdrawing');

        ai.hullState.adjustHealth(40); // 60% >= 0.5 resume point
        commander.update(bb, 0);
        expect(bb.goal).toBe('search-and-destroy');
    });

    it('never flees with fleeThreshold 0', () => {
        const state = createWorld();
        const setup = { ...aiSetup(), fleeThreshold: 0 };
        const ai = new AiShip(state, setup);
        state.add(ai);
        const bb = createBlackboard({ type: 'search-and-destroy' });
        const commander = new Commander(ai, state, resolveAiConfig(setup as never));
        ai.hullState.adjustHealth(-99);
        commander.update(bb, 0);
        expect(bb.goal).toBe('search-and-destroy');
    });

    it('guard-ship becomes search-and-destroy when the ward dies', () => {
        const state = createWorld();
        const ward = new AiShip(state, { ...shipSetup('raiders', 3, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(ward);
        const setup = { ...aiSetup(), goal: { type: 'guard-ship' as const, shipId: ward.id } };
        const ai = new AiShip(state, setup);
        state.add(ai);
        const bb = createBlackboard(setup.goal);
        const commander = new Commander(ai, state, resolveAiConfig(setup as never));

        commander.update(bb, 0);
        expect(bb.goal).toBe('guard-ship');

        state.remove(ward);
        commander.update(bb, 0);
        expect(bb.goal).toBe('search-and-destroy');
    });

    it('an unresolved scenario-authored scenarioId is dropped as an invalid ward on the first update', () => {
        const state = createWorld();
        const setup = { ...aiSetup(), goal: { type: 'guard-ship' as const, shipId: 'vip' } };
        const ai = new AiShip(state, setup);
        state.add(ai);
        const bb = createBlackboard(setup.goal);
        const commander = new Commander(ai, state, resolveAiConfig(setup as never));

        // 'vip' isn't a live object id, so without resolution the goal is dropped immediately.
        commander.update(bb, 0);
        expect(bb.goal).toBe('search-and-destroy');
    });

    it('resolveScenarioReferences turns a scenario-authored scenarioId into the ward\'s real runtime id', () => {
        const state = createWorld();
        const ward = new AiShip(state, { ...shipSetup('raiders', 3, 0), id: 'vip', goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(ward);
        const setup = { ...aiSetup(), goal: { type: 'guard-ship' as const, shipId: 'vip' } };
        const ai = new AiShip(state, setup);
        state.add(ai);
        const bb = createBlackboard(setup.goal);
        const commander = new Commander(ai, state, resolveAiConfig(setup as never));

        // Resolving before the first update, as `Encounter.spawnObjects` does, keeps the goal.
        commander.resolveScenarioReferences();
        commander.update(bb, 0);
        expect(bb.goal).toBe('guard-ship');

        // The ward is now tracked by its real id, so removing it (not some unrelated object) drops the goal.
        state.remove(ward);
        commander.update(bb, 0);
        expect(bb.goal).toBe('search-and-destroy');
    });

    it('resolveScenarioReferences is a no-op when shipId is already a live object id or unresolvable', () => {
        const state = createWorld();
        const ward = new AiShip(state, { ...shipSetup('raiders', 3, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(ward);
        const setup = { ...aiSetup(), goal: { type: 'guard-ship' as const, shipId: ward.id } };
        const ai = new AiShip(state, setup);
        state.add(ai);
        const bb = createBlackboard(setup.goal);
        const commander = new Commander(ai, state, resolveAiConfig(setup as never));

        commander.resolveScenarioReferences();
        commander.update(bb, 0);
        expect(bb.goal).toBe('guard-ship');

        const unresolvableSetup = { ...aiSetup(), goal: { type: 'guard-ship' as const, shipId: 'no-such-scenario-id' } };
        const unresolvableAi = new AiShip(state, unresolvableSetup);
        state.add(unresolvableAi);
        const unresolvableCommander = new Commander(unresolvableAi, state, resolveAiConfig(unresolvableSetup as never));
        const unresolvableBb = createBlackboard(unresolvableSetup.goal);

        unresolvableCommander.resolveScenarioReferences();
        unresolvableCommander.update(unresolvableBb, 0);
        expect(unresolvableBb.goal).toBe('search-and-destroy');
    });

    it('drops a target that becomes non-hostile at runtime', () => {
        const state = createWorld();
        const ai = new AiShip(state, aiSetup());
        state.add(ai);
        const foe = new AiShip(state, { ...shipSetup('player', 5, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(foe);
        ai.updateKnownObjects(0);

        const bb = createBlackboard({ type: 'search-and-destroy' });
        const commander = new Commander(ai, state, resolveAiConfig(aiSetup() as never));
        commander.update(bb, 0);
        expect(bb.targetId).toBe(foe.id);

        state.factionRegistry.setRelationship('raiders', 'player', RelationshipType.Friendly);
        commander.update(bb, 0);
        expect(bb.targetId).toBeNull();
    });

    it('prunes expired power requests', () => {
        const state = createWorld();
        const ai = new AiShip(state, aiSetup());
        state.add(ai);
        const bb = createBlackboard({ type: 'search-and-destroy' });
        bb.powerRequests.set('tactical', { desiredLevel: 4, expires: 100 });
        const commander = new Commander(ai, state, resolveAiConfig(aiSetup() as never));
        commander.update(bb, 200);
        expect(bb.powerRequests.has('tactical')).toBe(false);
    });

    it('wanders to a random point when search-and-destroy has no known hostiles', () => {
        const state = createWorld(fixedRandom());
        const ai = new AiShip(state, aiSetup());
        state.add(ai);
        ai.updateKnownObjects(0);

        const bb = createBlackboard({ type: 'search-and-destroy' });
        const commander = new Commander(ai, state, resolveAiConfig(aiSetup() as never));
        commander.update(bb, state.currentTime);

        expect(bb.destination).not.toBeNull();
        expect(bb.destination).toEqual({ x: 40, y: 0 });
    });

    it('keeps a stable wander destination across updates until it is reached', () => {
        const state = createWorld(fixedRandom());
        const ai = new AiShip(state, aiSetup());
        state.add(ai);
        ai.updateKnownObjects(0);

        const bb = createBlackboard({ type: 'search-and-destroy' });
        const commander = new Commander(ai, state, resolveAiConfig(aiSetup() as never));
        commander.update(bb, state.currentTime);
        const firstDestination = bb.destination;
        expect(firstDestination).not.toBeNull();

        commander.update(bb, state.currentTime);

        expect(bb.destination).toBe(firstDestination);
        expect(bb.destination).toEqual(firstDestination);
    });

    it('targets a known hostile instead of wandering', () => {
        const state = createWorld(throwingRandom());
        const ai = new AiShip(state, aiSetup());
        state.add(ai);
        // 20 units away: well beyond WANDER_ARRIVAL_RADIUS, so a mid-pursuit update must target
        // the hostile directly rather than falling back to patrol-wander (which would consume
        // randomness from throwingRandom and fail this test). Persistence after losing the
        // hostile is covered separately by "preserves a distant lastKnownTargetPosition" below.
        const foe = new AiShip(state, { ...shipSetup('player', 20, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(foe);
        ai.updateKnownObjects(0);

        const bb = createBlackboard({ type: 'search-and-destroy' });
        const commander = new Commander(ai, state, resolveAiConfig(aiSetup() as never));
        commander.update(bb, state.currentTime);

        expect(bb.targetId).toBe(foe.id);
        expect(bb.destination).toEqual(expect.objectContaining({ x: 20, y: 0 }));
    });

    it('clears lastKnownTargetPosition and starts patrol-wandering once the ship arrives there with no target reacquired', () => {
        const state = createWorld(fixedRandom());
        const ai = new AiShip(state, aiSetup());
        state.add(ai);
        const foe = new AiShip(state, { ...shipSetup('player', 3, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(foe);
        ai.updateKnownObjects(0);

        const bb = createBlackboard({ type: 'search-and-destroy' });
        const commander = new Commander(ai, state, resolveAiConfig(aiSetup() as never));
        commander.update(bb, state.currentTime);

        expect(bb.targetId).toBe(foe.id);
        expect(bb.lastKnownTargetPosition).toEqual(expect.objectContaining({ x: 3, y: 0 }));

        // Hostile is lost, and its last-known position (3, 0) is within WANDER_ARRIVAL_RADIUS of the
        // ship's own position (0, 0) — i.e. the ship has already "arrived" there without reacquiring
        // a target. It should give up on the stale point and transition straight to patrol-wander in
        // this same update, consuming randomness to pick a fresh wander destination.
        state.remove(foe);
        ai.updateKnownObjects(state.currentTime);
        commander.update(bb, state.currentTime);

        expect(bb.targetId).toBeNull();
        expect(bb.lastKnownTargetPosition).toBeNull();
        expect(bb.destination).toEqual({ x: 40, y: 0 });
    });

    it('preserves a distant lastKnownTargetPosition (beyond arrival radius) without consuming randomness', () => {
        const state = createWorld(throwingRandom());
        const ai = new AiShip(state, aiSetup());
        state.add(ai);
        const foe = new AiShip(state, { ...shipSetup('player', 30, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(foe);
        ai.updateKnownObjects(0);

        const bb = createBlackboard({ type: 'search-and-destroy' });
        const commander = new Commander(ai, state, resolveAiConfig(aiSetup() as never));
        commander.update(bb, state.currentTime);

        expect(bb.targetId).toBe(foe.id);
        expect(bb.lastKnownTargetPosition).toEqual(expect.objectContaining({ x: 30, y: 0 }));

        // Hostile is lost, and its last-known position (30, 0) is well beyond WANDER_ARRIVAL_RADIUS —
        // the ship has not yet arrived there, so it must be preserved and pursued, with no randomness
        // consumed (per throwingRandom).
        state.remove(foe);
        ai.updateKnownObjects(state.currentTime);
        expect(() => commander.update(bb, state.currentTime)).not.toThrow();

        expect(bb.targetId).toBeNull();
        expect(bb.lastKnownTargetPosition).not.toBeNull();
        expect(bb.destination).toBe(bb.lastKnownTargetPosition);
    });

    it('flees for good once told to withdraw, whatever the state of its hull', () => {
        const state = createWorld();
        const setup = { ...aiSetup(), fleeThreshold: 0 };
        const ai = new AiShip(state, setup);
        state.add(ai);
        const bb = createBlackboard({ type: 'search-and-destroy' });
        const commander = new Commander(ai, state, resolveAiConfig(setup as never));

        commander.update(bb, 0);
        expect(bb.goal).toBe('search-and-destroy');
        expect(commander.isWithdrawing).toBe(false);

        commander.withdraw();
        commander.update(bb, 0);
        expect(commander.isWithdrawing).toBe(true);
        expect(bb.goal).toBe('flee');
        expect(bb.stance).toBe('withdrawing');

        // Still at full health, and it stays gone.
        commander.update(bb, 0);
        expect(bb.goal).toBe('flee');
    });

    it('no longer flees from damage once told to stand fast, and comes back if it already was', () => {
        const state = createWorld();
        const ai = new AiShip(state, aiSetup());
        state.add(ai);
        const bb = createBlackboard({ type: 'search-and-destroy' });
        const commander = new Commander(ai, state, resolveAiConfig(aiSetup() as never));

        ai.hullState.adjustHealth(-80);
        commander.update(bb, 0);
        expect(bb.goal).toBe('flee');

        commander.standFast();
        commander.update(bb, 0);
        expect(bb.goal).toBe('search-and-destroy');
    });

    it('standing fast does not hold back a ship that is withdrawing', () => {
        const state = createWorld();
        const ai = new AiShip(state, aiSetup());
        state.add(ai);
        const bb = createBlackboard({ type: 'search-and-destroy' });
        const commander = new Commander(ai, state, resolveAiConfig(aiSetup() as never));

        commander.withdraw();
        commander.standFast();
        commander.update(bb, 0);

        expect(bb.goal).toBe('flee');
    });

    it('goes back to its goal when a withdrawal is called off', () => {
        const state = createWorld();
        const ai = new AiShip(state, aiSetup());
        state.add(ai);
        const bb = createBlackboard({ type: 'search-and-destroy' });
        const commander = new Commander(ai, state, resolveAiConfig(aiSetup() as never));

        commander.withdraw();
        commander.update(bb, 0);
        expect(bb.goal).toBe('flee');

        commander.rally();
        commander.update(bb, 0);
        expect(commander.isWithdrawing).toBe(false);
        expect(bb.goal).toBe('search-and-destroy');
    });

    it('a withdrawing ship runs from hostiles outside the area it was defending', () => {
        const state = createWorld();
        const setup = aiSetup({ goal: { type: 'defend-position', position: { x: 0, y: 0, angle: 0 }, radius: 5 } });
        const ai = new AiShip(state, setup);
        state.add(ai);
        const intruder = new AiShip(state, { ...shipSetup('player', 20, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(intruder);
        ai.updateKnownObjects(0);

        const bb = createBlackboard(setup.goal);
        const commander = new Commander(ai, state, resolveAiConfig(setup as never));

        // It ignores the intruder while defending, as that's outside its radius.
        commander.update(bb, 0);
        expect(bb.targetId).toBeNull();

        commander.withdraw();
        commander.update(bb, 0);

        expect(bb.destination).not.toBeNull();
        expect(bb.destination!.x).toBeLessThan(0);
    });

    describe('travel-route', () => {
        const waypoints = [{ x: 10, y: 0 }, { x: 10, y: -10 }];
        const routeSetup = () => aiSetup({ goal: { type: 'travel-route', waypoints, arrivalRadius: 2 } });

        function moveTo(ai: AiShip, x: number, y: number) {
            ai.motion.clear();
            ai.motion.push(new MotionKeyframe(0, x, y, 0));
        }

        it('heads for each waypoint in turn, then holds at the last', () => {
            const state = createWorld();
            const setup = routeSetup();
            const ai = new AiShip(state, setup);
            state.add(ai);
            const bb = createBlackboard(setup.goal);
            const commander = new Commander(ai, state, resolveAiConfig(setup as never));

            commander.update(bb, 0);
            expect(bb.goal).toBe('travel-route');
            expect(bb.destination).toEqual(waypoints[0]);
            expect(commander.waypointsReached).toBe(0);
            expect(commander.isRouteComplete).toBe(false);

            // Close enough counts.
            moveTo(ai, 8.5, 0);
            commander.update(bb, 0);
            expect(commander.waypointsReached).toBe(1);
            expect(bb.destination).toEqual(waypoints[1]);

            moveTo(ai, 10, -10);
            commander.update(bb, 0);
            expect(commander.waypointsReached).toBe(2);
            expect(commander.isRouteComplete).toBe(true);
            expect(bb.destination).toEqual(waypoints[1]);
        });

        it('keeps to its route with a hostile in reach, which it still picks out to shoot at', () => {
            const state = createWorld();
            const setup = routeSetup();
            const ai = new AiShip(state, setup);
            state.add(ai);
            const hostile = new AiShip(state, { ...shipSetup('player', 3, 3), goal: { type: 'search-and-destroy' }, skill: 1 });
            state.add(hostile);
            ai.updateKnownObjects(0);

            const bb = createBlackboard(setup.goal);
            const commander = new Commander(ai, state, resolveAiConfig(setup as never));
            commander.update(bb, 0);

            expect(bb.targetId).toBe(hostile.id);
            expect(bb.stance).toBe('travelling');
            expect(bb.destination).toEqual(waypoints[0]);
        });

        it('still flees if it is damaged enough, and it is the kind that flees', () => {
            const state = createWorld();
            const setup = routeSetup();
            const ai = new AiShip(state, setup);
            state.add(ai);
            const bb = createBlackboard(setup.goal);
            const commander = new Commander(ai, state, resolveAiConfig(setup as never));

            ai.hullState.adjustHealth(-80);
            commander.update(bb, 0);

            expect(bb.goal).toBe('flee');
            expect(bb.stance).toBe('withdrawing');
        });

        it('is never complete for a ship with some other goal', () => {
            const state = createWorld();
            const ai = new AiShip(state, aiSetup());
            state.add(ai);
            const commander = new Commander(ai, state, resolveAiConfig(aiSetup() as never));

            commander.update(createBlackboard({ type: 'search-and-destroy' }), 0);

            expect(commander.isRouteComplete).toBe(false);
            expect(commander.waypointsReached).toBe(0);
        });
    });

    describe('new orders', () => {
        it('a guard given search-and-destroy hunts a hostile its leash would have kept it from', () => {
            const state = createWorld();
            const ward = new AiShip(state, { ...shipSetup('raiders', 0, 0), id: 'ward', goal: { type: 'search-and-destroy' }, skill: 1 });
            state.add(ward);
            const setup = aiSetup({ goal: { type: 'guard-ship', shipId: 'ward' } });
            const ai = new AiShip(state, setup);
            state.add(ai);
            const hostile = new AiShip(state, { ...shipSetup('player', 60, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
            state.add(hostile);
            ai.updateKnownObjects(0);

            const bb = createBlackboard(setup.goal);
            const commander = new Commander(ai, state, resolveAiConfig(setup as never));
            commander.resolveScenarioReferences();
            commander.update(bb, 0);
            expect(bb.goal).toBe('guard-ship');
            expect(bb.targetId).toBeNull();

            commander.setGoal({ type: 'search-and-destroy' });
            commander.update(bb, 0);

            expect(commander.goal).toEqual({ type: 'search-and-destroy' });
            expect(bb.goal).toBe('search-and-destroy');
            expect(bb.targetId).toBe(hostile.id);
            expect(bb.destination).toEqual(expect.objectContaining({ x: 60, y: 0 }));
        });

        it('a route is flown from its first waypoint, and a ward can be named by scenario id', () => {
            const state = createWorld();
            const ward = new AiShip(state, { ...shipSetup('raiders', 10, 10), id: 'ward', goal: { type: 'search-and-destroy' }, skill: 1 });
            state.add(ward);
            const setup = aiSetup({ goal: { type: 'travel-route', waypoints: [{ x: 0, y: 0 }, { x: 10, y: 0 }], arrivalRadius: 2 } });
            const ai = new AiShip(state, setup);
            state.add(ai);
            const bb = createBlackboard(setup.goal);
            const commander = new Commander(ai, state, resolveAiConfig(setup as never));

            commander.update(bb, 0);
            expect(commander.waypointsReached).toBe(1);

            commander.setGoal({ type: 'travel-route', waypoints: [{ x: 0, y: -10 }], arrivalRadius: 2 });
            commander.update(bb, 0);
            expect(commander.waypointsReached).toBe(0);
            expect(bb.destination).toEqual({ x: 0, y: -10 });

            commander.setGoal({ type: 'guard-ship', shipId: 'ward' });
            commander.update(bb, 0);
            expect(commander.goal).toEqual({ type: 'guard-ship', shipId: ward.id });
            expect(bb.destination).toEqual(expect.objectContaining({ x: 10, y: 10 }));
        });

        it('a ship that is withdrawing keeps withdrawing, and follows its new goal once rallied', () => {
            const state = createWorld();
            const ai = new AiShip(state, aiSetup());
            state.add(ai);
            const bb = createBlackboard({ type: 'search-and-destroy' });
            const commander = new Commander(ai, state, resolveAiConfig(aiSetup() as never));

            commander.withdraw();
            commander.setGoal({ type: 'defend-position', position: { x: 5, y: 5, angle: 0 }, radius: 30 });
            commander.update(bb, 0);
            expect(bb.goal).toBe('flee');

            commander.rally();
            commander.update(bb, 0);
            expect(bb.goal).toBe('defend-position');
            expect(bb.destination).toEqual({ x: 5, y: 5, angle: 0 });
        });

        it('a ship told to stand down has no target and nowhere to go, until it rallies', () => {
            const state = createWorld();
            const ai = new AiShip(state, aiSetup());
            state.add(ai);
            const hostile = new AiShip(state, { ...shipSetup('player', 5, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
            state.add(hostile);
            ai.updateKnownObjects(0);
            const bb = createBlackboard({ type: 'search-and-destroy' });
            const commander = new Commander(ai, state, resolveAiConfig(aiSetup() as never));

            commander.update(bb, 0);
            expect(bb.targetId).toBe(hostile.id);

            commander.standDown();
            commander.update(bb, 0);
            expect(commander.isStandingDown).toBe(true);
            expect(bb.goal).toBe('search-and-destroy');
            expect(bb.targetId).toBeNull();
            expect(bb.destination).toBeNull();
            expect(bb.stance).toBe('holding');

            commander.rally();
            commander.update(bb, 0);
            expect(commander.isStandingDown).toBe(false);
            expect(bb.targetId).toBe(hostile.id);
        });

        it('a ship told to stand down calls off the manoeuvre it was flying', () => {
            const state = createWorld();
            const setup = aiSetup({ helm: { cards: ['slowAndSteady'], maxPowerLevel: 5, initialHandSize: 1 } });
            const ai = new AiShip(state, setup);
            state.add(ai);
            const card = ai.helmState.hand[0];
            ai.helmState.playCard(card.id, card.type, 'location', '10,0');
            expect(ai.helmState.activeManeuver).not.toBeNull();

            const commander = new Commander(ai, state, resolveAiConfig(setup as never));
            commander.standDown();
            commander.update(createBlackboard({ type: 'search-and-destroy' }), 0);
            ai.helmState.update(state.currentTime);

            expect(ai.helmState.activeManeuver).toBeNull();
        });

        it('a ship that is fleeing goes on fleeing when told to stand down', () => {
            const state = createWorld();
            const ai = new AiShip(state, aiSetup());
            state.add(ai);
            const bb = createBlackboard({ type: 'search-and-destroy' });
            const commander = new Commander(ai, state, resolveAiConfig(aiSetup() as never));

            commander.withdraw();
            commander.standDown();
            commander.update(bb, 0);

            expect(bb.goal).toBe('flee');
            expect(bb.stance).toBe('withdrawing');
        });
    });

    describe('a preferred target', () => {
        function createHunt(preferredDistance: number, otherDistance: number) {
            const state = createWorld();
            const preferred = new AiShip(state, { ...shipSetup('player', preferredDistance, 0), id: 'ward', goal: { type: 'search-and-destroy' }, skill: 1 });
            const other = new AiShip(state, { ...shipSetup('player', -otherDistance, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
            state.add(preferred);
            state.add(other);

            const setup = aiSetup({ goal: { type: 'search-and-destroy', prefer: 'ward' } });
            const ai = new AiShip(state, setup);
            state.add(ai);
            ai.updateKnownObjects(0);

            const bb = createBlackboard(setup.goal);
            const commander = new Commander(ai, state, resolveAiConfig(setup as never));
            commander.resolveScenarioReferences();
            commander.update(bb, 0);

            return { bb, preferred, other };
        }

        it('is gone after even when something else is rather closer', () => {
            const { bb, preferred } = createHunt(20, 5);

            expect(bb.targetId).toBe(preferred.id);
        });

        it('is passed over for something very much closer', () => {
            const { bb, other } = createHunt(PREFER_BONUS + 10, 5);

            expect(bb.targetId).toBe(other.id);
        });
    });

    describe('what it goes for', () => {
        function createFight() {
            const state = createWorld();
            const ai = new AiShip(state, aiSetup());
            state.add(ai);
            const first = new AiShip(state, { ...shipSetup('player', 5, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
            state.add(first);
            ai.updateKnownObjects(0);
            ai.tacticalState.setSystemSubTargets(first.id, ['helm', 'tactical']);
            const bb = createBlackboard({ type: 'search-and-destroy' });
            const commander = new Commander(ai, state, resolveAiConfig(aiSetup() as never));
            const goForHull = vi.spyOn(state.random, 'getBoolean');
            return { state, ai, first, bb, commander, goForHull };
        }

        it('goes for the hull of a new target some of the time, with no system to focus on, so tactical fires plain shots', () => {
            const { first, bb, commander, goForHull } = createFight();
            goForHull.mockReturnValueOnce(true);

            commander.update(bb, 0);

            expect(bb.targetId).toBe(first.id);
            expect(goForHull).toHaveBeenCalledWith(HULL_FOCUS_CHANCE);
            expect(bb.focusSystem).toBeNull();
        });

        it('otherwise goes for its systems once science has identified them, tactical first and then helm', () => {
            const { ai, first, bb, commander, goForHull } = createFight();
            goForHull.mockReturnValueOnce(false);

            commander.update(bb, 0);
            expect(bb.focusSystem).toBe('tactical');

            ai.tacticalState.setSystemSubTargets(first.id, ['helm']);
            commander.update(bb, 100);
            expect(bb.focusSystem).toBe('helm');
        });

        it('sticks to what it decided while the target lasts, and decides again for a new target', () => {
            const { state, ai, first, bb, commander, goForHull } = createFight();
            goForHull.mockReturnValueOnce(true).mockReturnValueOnce(false);

            commander.update(bb, 0);
            commander.update(bb, 100);
            commander.update(bb, 200);
            expect(goForHull).toHaveBeenCalledTimes(1);
            expect(bb.focusSystem).toBeNull();

            // The first target is lost, and another taken.
            state.remove(first);
            const second = new AiShip(state, { ...shipSetup('player', 6, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
            state.add(second);
            ai.updateKnownObjects(300);
            ai.tacticalState.setSystemSubTargets(second.id, ['tactical']);
            commander.update(bb, 300);

            expect(bb.targetId).toBe(second.id);
            expect(goForHull).toHaveBeenCalledTimes(2);
            expect(bb.focusSystem).toBe('tactical');
        });
    });
});
