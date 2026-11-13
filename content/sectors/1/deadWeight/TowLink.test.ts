import { distance } from 'common-data/features/space/utils/vectors';
import { createShipSetup } from 'engine/campaign/shipDesigns';
import { AiShip } from 'engine/state/AiShip';
import { MotionKeyframe } from 'engine/state/MotionKeyframe';
import { setupGameRoom } from 'engine/testUtils';
import { describe, expect, it } from 'vitest';
import { TowLink } from './TowLink.engine';

const rooms = setupGameRoom();
const length = 2.5;

function createTow() {
    const state = rooms.createState();
    state.initFactions([{ id: 'player' }], 'player');
    state.factionRegistry.setEncounterFactions([{ id: 'side' }]);

    const tower = new AiShip(state, createShipSetup('tug', 'side', { x: 0, y: 0, angle: 0 }, { priorities: { helm: 0, tactical: 0, science: 0 } }));
    const towed = new AiShip(state, createShipSetup('waterModule', 'side', { x: 50, y: 50, angle: 2 }));
    state.add(tower);
    state.add(towed);

    return { state, tower, towed, line: new TowLink(tower, towed, length) };
}

describe('a tow line', () => {
    it('puts what it tows the line\'s length astern of the tower straight away', () => {
        const { state, towed } = createTow();

        expect(towed.getPosition(state.currentTime)).toEqual({ x: -length, y: 0, angle: 0 });
    });

    it('keeps it astern as the tower flies, and roughly so through a turn', () => {
        const { state, tower, towed, line } = createTow();
        const now = state.currentTime;
        // Ahead, then a turn to starboard, which is towards positive y, with angles counter-clockwise and y pointing down.
        tower.setMotion(
            new MotionKeyframe(now, 0, 0, 0),
            new MotionKeyframe(now + 10_000, 10, 0, 0),
            new MotionKeyframe(now + 20_000, 10, 10, -Math.PI / 2)
        );
        line.update();

        // Each point is moved back along its own heading, and the course between points is a curve, so mid-turn the line slackens and stretches: from 1.8 to 2.7, through a quarter turn over 14 units.
        for (let at = 0; at <= 30_000; at += 250) {
            const towerAt = tower.getPosition(now + at);
            const towedAt = towed.getPosition(now + at);

            expect(distance(towerAt, towedAt)).toBeGreaterThan(length - 0.75);
            expect(distance(towerAt, towedAt)).toBeLessThan(length + 0.25);
            expect(towedAt.angle).toBeCloseTo(towerAt.angle, 5);
        }

        // It's exact at each point of the course, and anywhere on a course that's straight throughout (see below).
        for (const at of [0, 10_000, 20_000, 30_000]) {
            expect(distance(tower.getPosition(now + at), towed.getPosition(now + at))).toBeCloseTo(length, 5);
        }

        // Heading towards positive y, it's on the negative y side of the tower.
        expect(towed.getPosition(now + 20_000)).toMatchObject({ x: expect.closeTo(10, 5), y: expect.closeTo(10 - length, 5) });
    });

    it('follows each new course the tower is given', () => {
        const { state, tower, towed, line } = createTow();
        const now = state.currentTime;

        tower.setMotion(new MotionKeyframe(now, 0, 0, 0), new MotionKeyframe(now + 10_000, 10, 0, 0));
        line.update();
        state.currentTime += 5000;
        const here = tower.getPosition(state.currentTime);
        tower.setMotion(new MotionKeyframe(state.currentTime, here.x, here.y, 0), new MotionKeyframe(state.currentTime + 1000, here.x, here.y, 0));
        line.update();

        state.currentTime += 10_000;
        expect(towed.getPosition(state.currentTime)).toMatchObject({ x: expect.closeTo(here.x - length, 5), y: expect.closeTo(0, 5) });
    });

    it('leaves it where it is once it\'s released, whatever the tower does next', () => {
        const { state, tower, towed, line } = createTow();
        const now = state.currentTime;
        tower.setMotion(new MotionKeyframe(now, 0, 0, 0), new MotionKeyframe(now + 10_000, 10, 0, 0));
        line.update();

        state.currentTime += 4000;
        const where = towed.getPosition(state.currentTime);
        line.release(state.currentTime);
        tower.setMotion(new MotionKeyframe(state.currentTime, 4, 0, 0), new MotionKeyframe(state.currentTime + 10_000, 40, 40, 1));
        line.update();

        expect(line.isAttached).toBe(false);
        state.currentTime += 10_000;
        expect(towed.getPosition(state.currentTime)).toEqual(where);
    });
});
