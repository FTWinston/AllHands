import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { parseVector, distance } from 'common-data/features/space/utils/vectors';
import { IRandom } from 'common-data/types/IRandom';
import { AiShip } from 'src/state/AiShip';
import { CardState } from 'src/state/CardState';
import { MotionKeyframe } from 'src/state/MotionKeyframe';
import { shipSetup, setupGameRoom } from 'src/testUtils';
import { describe, it, expect, vi } from 'vitest';
import { createBlackboard, resolveAiConfig } from '../types';
import { HelmOfficer } from './HelmOfficer';

function fixedRandom(): IRandom {
    return {
        getFloat: () => 0, getBoolean: () => false, getInt: () => 0,
        pick: values => values[0],
        insert: (array, value) => {
            (array as unknown as unknown[]).push(value);
        },
        delete: values => (values as unknown as unknown[]).pop() as never,
        shuffle: () => {},
    };
}

const rooms = setupGameRoom();

function createWorld(helmCards: string[], targetDistance: number) {
    const state = rooms.createState(fixedRandom());
    state.initFactions([
        { id: 'player' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ], 'player');
    const setup = { ...shipSetup('raiders'), goal: { type: 'search-and-destroy' as const }, skill: 1 };
    setup.helm = { ...setup.helm, cards: helmCards as never, initialHandSize: helmCards.length };
    const ship = new AiShip(state, setup);
    state.add(ship);
    const enemy = new AiShip(state, { ...shipSetup('player', targetDistance, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
    state.add(enemy);
    ship.updateKnownObjects(0);

    const officer = new HelmOfficer(ship, state, resolveAiConfig(setup as never));
    const bb = createBlackboard(setup.goal);
    bb.targetId = enemy.id;
    bb.stance = 'aggressive';
    bb.desiredRange = { min: 2, max: 8 };
    return { state, ship, enemy, officer, bb };
}

describe('HelmOfficer', () => {
    it('closes toward the desired range band when idle and far away', () => {
        const { ship, enemy, officer, bb } = createWorld(['slowAndSteady'], 40);
        const playSpy = vi.spyOn(ship.helmState, 'playCard');
        officer.think(bb, 0);
        expect(playSpy).toHaveBeenCalled();
        const [, cardType, targetType, targetId] = playSpy.mock.calls[0];
        expect(targetType).toBe('location');
        expect(cardType).toBe('slowAndSteady');
        const location = parseVector(targetId as string)!;
        const enemyPos = enemy.getPosition(0);
        expect(distance(location, enemyPos)).toBeLessThanOrEqual(bb.desiredRange.max + 1);
    });

    it('keeps moving when already inside the desired range band, rather than sitting still', () => {
        const { ship, officer, bb } = createWorld(['slowAndSteady'], 5); // already in band, no weapon loaded
        const playSpy = vi.spyOn(ship.helmState, 'playCard');
        officer.think(bb, 0);
        expect(playSpy).toHaveBeenCalled();
    });

    it('holds position while a ready weapon is pointed at the target', () => {
        const { ship, officer, bb } = createWorld(['slowAndSteady', 'zigZag'], 5); // in band, facing the target
        const slot = ship.tacticalState.slots[0];
        slot.card = new CardState(999, 'photonTorpedo');
        slot.addCharge(slot.getParameter('totalCharge'), 0);
        const playSpy = vi.spyOn(ship.helmState, 'playCard');
        officer.think(bb, 0);
        expect(playSpy).not.toHaveBeenCalled();
    });

    it('turns toward the target once its weapon is ready', () => {
        const { ship, enemy, officer, bb } = createWorld(['slowAndSteady'], 7);
        ship.setMotion(new MotionKeyframe(0, 0, 0, Math.PI)); // facing directly away
        const slot = ship.tacticalState.slots[0];
        slot.card = new CardState(999, 'photonTorpedo');
        slot.addCharge(slot.getParameter('totalCharge'), 0);
        bb.desiredRange = { min: 0, max: 20 };
        const playSpy = vi.spyOn(ship.helmState, 'playCard');
        officer.think(bb, 0);
        expect(playSpy).toHaveBeenCalled();
        // A short hop straight at the target, which ends facing it.
        const location = parseVector(playSpy.mock.calls[0][3] as string)!;
        expect(location.y).toBeCloseTo(0);
        expect(location.x).toBeGreaterThan(0);
        expect(location.x).toBeLessThan(enemy.getPosition(0).x);
    });

    it('prefers the evasive card when stance is evasive', () => {
        const { ship, officer, bb } = createWorld(['slowAndSteady', 'zigZag'], 40);
        bb.stance = 'evasive';
        const playSpy = vi.spyOn(ship.helmState, 'playCard');
        officer.think(bb, 0);
        expect(playSpy).toHaveBeenCalled();
        expect(playSpy.mock.calls[0][1]).toBe('zigZag'); // evasion 25 beats evasion 0 at 0.8 weight
    });

    it('cancels a maneuver that no longer makes sense, then plays its replacement', () => {
        const { state, ship, enemy, officer, bb } = createWorld(['slowAndSteady', 'slowAndSteady'], 40);
        // GameState.currentTime seeds from ClockTimer, which is Date.now() (not 0) even when not running
        // (@colyseus/clock Clock.start sets currentTime = this.now()). Motion keyframe times (from
        // applyMotionCard) are anchored to that real value, so "now" for this test must be too --
        // otherwise a literal 0/100 sits far in the past relative to the ship's already-real-timed
        // motion, and interpolatePosition's left-to-right findIndex matches the stale keyframe first.
        const now = state.currentTime;
        officer.think(bb, now); // starts a maneuver toward the target
        expect(ship.helmState.activeManeuver).not.toBeNull();

        // Target teleports far away in the opposite direction: current trajectory is now worthless.
        enemy.setMotion(new MotionKeyframe(now, -80, 0, 0));
        const cancelSpy = vi.spyOn(ship.helmState, 'cancelActiveManeuver');
        const playSpy = vi.spyOn(ship.helmState, 'playCard');
        officer.think(bb, now + 100);
        expect(cancelSpy).toHaveBeenCalled();
        expect(playSpy).not.toHaveBeenCalled(); // playing over the running maneuver would orphan its card

        // Once the cancelled maneuver has stopped, the replacement is played.
        ship.helmState.update(now + 150);
        expect(ship.helmState.activeManeuver).toBeNull();
        officer.update(now + 150);
        expect(playSpy).toHaveBeenCalled();
        const location = parseVector(playSpy.mock.calls[0][3] as string)!;
        expect(location.x).toBeLessThan(0);
    });

    it('does not cancel a maneuver when it has no card to replace it with', () => {
        const { state, ship, enemy, officer, bb } = createWorld(['slowAndSteady'], 40);
        const now = state.currentTime;
        officer.think(bb, now);
        expect(ship.helmState.hand.length).toBe(0);

        enemy.setMotion(new MotionKeyframe(now, -80, 0, 0));
        const cancelSpy = vi.spyOn(ship.helmState, 'cancelActiveManeuver');
        officer.think(bb, now + 100);
        expect(cancelSpy).not.toHaveBeenCalled();
    });
});
