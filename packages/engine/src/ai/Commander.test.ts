import { ClockTimer } from '@colyseus/timer';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { IRandom } from 'common-data/types/IRandom';
import { AiShip } from 'src/state/AiShip';
import { GameState } from 'src/state/GameState';
import { shipSetup } from 'src/testUtils';
import { IdProvider } from 'src/types/IdProvider';
import { describe, it, expect } from 'vitest';
import { Commander } from './Commander';
import { createBlackboard, resolveAiConfig } from './types';

function createWorld(random?: IRandom) {
    let nextId = 1;
    const idPool: IdProvider = { getId: () => String(nextId++), releaseId: () => {} };
    const state = new GameState(idPool, new ClockTimer(false), 1, random);
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
});
