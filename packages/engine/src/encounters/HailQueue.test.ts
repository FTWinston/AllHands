import { getHailDuration, minHailDuration } from 'common-data/features/sectors/types/HailInfo';
import { PromptState } from 'src/state/PromptState';
import { setupGameRoom } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import { HailQueue } from './HailQueue';
import type { GameState } from 'src/state/GameState';

const rooms = setupGameRoom();

const withdrawing = 'Cost exceeds mandate. Withdrawing.';
const noQuarter = 'Assize is gone. No quarter.';
const turning = 'Coming about to port in five.';

function createQueue(timeScale = 1) {
    const state = rooms.createState();
    state.timeScale = timeScale;
    return { state, hails: new HailQueue(state) };
}

/** Moves game time on, and has the queue catch up. */
function wait(state: GameState, hails: HailQueue, ms: number) {
    state.currentTime += ms;
    hails.update();
}

describe('HailQueue', () => {
    it('shows who is speaking and what they said, straight away when nothing else is', () => {
        const { state, hails } = createQueue();
        expect(state.hail).toBeNull();

        hails.say('Warden Cruiser Assize', withdrawing);

        expect(state.hail).toMatchObject({ speaker: 'Warden Cruiser Assize', text: withdrawing });
    });

    it('clears a line once there has been time to read it', () => {
        const { state, hails } = createQueue();
        hails.say('Warden Cruiser Assize', withdrawing);

        wait(state, hails, getHailDuration(withdrawing) - 1);
        expect(state.hail).not.toBeNull();

        wait(state, hails, 1);
        expect(state.hail).toBeNull();
        expect(hails.isBusy).toBe(false);
    });

    it('keeps the next line waiting until the last has been read, then gives it its own full time', () => {
        const { state, hails } = createQueue();
        hails.say('Warden Cruiser Assize', withdrawing);
        hails.say('Escort One', noQuarter);

        expect(state.hail).toMatchObject({ text: withdrawing });

        wait(state, hails, getHailDuration(withdrawing));
        expect(state.hail).toMatchObject({ speaker: 'Escort One', text: noQuarter });

        wait(state, hails, getHailDuration(noQuarter) - 1);
        expect(state.hail).toMatchObject({ text: noQuarter });

        wait(state, hails, 1);
        expect(state.hail).toBeNull();
    });

    it.each([2, 0.5])('gives just as long to read a line, in real time, when the game clock runs at %fx', (timeScale) => {
        const { state, hails } = createQueue(timeScale);
        hails.say('Warden Cruiser Assize', withdrawing);

        wait(state, hails, getHailDuration(withdrawing) * timeScale - 1);
        expect(state.hail).not.toBeNull();

        wait(state, hails, 1);
        expect(state.hail).toBeNull();
    });

    it('counts how long a line has been up in real time, even when the clock changes speed partway through', () => {
        const { state, hails } = createQueue();
        hails.say('Warden Cruiser Assize', withdrawing);
        const duration = getHailDuration(withdrawing);

        wait(state, hails, duration / 2);
        state.timeScale = 2;
        wait(state, hails, duration - 2);
        expect(state.hail).not.toBeNull();

        wait(state, hails, 2);
        expect(state.hail).toBeNull();
    });

    it('says urgent lines before anything else that is waiting, but after other urgent ones', () => {
        const { state, hails } = createQueue();
        hails.say('Someone', 'First.', { urgent: true });
        hails.say('Someone', 'Ordinary.');
        hails.say('Someone', 'Urgent.', { urgent: true });
        hails.say('Someone', 'Also urgent.', { urgent: true });

        const said = [state.hail!.text];
        for (let i = 0; i < 3; i++) {
            wait(state, hails, getHailDuration(said[said.length - 1]));
            said.push(state.hail!.text);
        }

        expect(said).toEqual(['First.', 'Urgent.', 'Also urgent.', 'Ordinary.']);
    });

    it('lets an urgent line cut short an ordinary one, but not before it has been up for the least time', () => {
        const { state, hails } = createQueue();
        const long = 'A very long line that would take quite some time to read, if anyone were to read every word of it, which they might.';
        hails.say('Someone', long);
        hails.say('Clinic Ship Marrow', turning, { urgent: true });

        wait(state, hails, minHailDuration - 1);
        expect(state.hail).toMatchObject({ text: long });

        wait(state, hails, 1);
        expect(state.hail).toMatchObject({ text: turning });
    });

    it('never lets one urgent line cut short another', () => {
        const { state, hails } = createQueue();
        hails.say('Clinic Ship Marrow', turning, { urgent: true });
        hails.say('Clinic Ship Marrow', 'Coming about to starboard in five.', { urgent: true });

        wait(state, hails, getHailDuration(turning) - 1);
        expect(state.hail).toMatchObject({ text: turning });
    });

    it('drops a line that has waited longer than it is worth', () => {
        const { state, hails } = createQueue();
        hails.say('Warden Cruiser Assize', withdrawing);
        hails.say('Clinic Ship Marrow', 'We have Harrier Two.', { maxDelayMs: getHailDuration(withdrawing) - 1 });

        wait(state, hails, getHailDuration(withdrawing));

        expect(state.hail).toBeNull();
        expect(hails.isBusy).toBe(false);
    });

    it('can be silenced, which drops everything that was waiting too', () => {
        const { state, hails } = createQueue();
        hails.say('Warden Cruiser Assize', withdrawing);
        hails.say('Escort One', noQuarter);

        hails.silence();

        expect(state.hail).toBeNull();
        wait(state, hails, getHailDuration(withdrawing));
        expect(state.hail).toBeNull();
    });

    it('carries on while the crew is being asked something, as the viewscreen shows both', () => {
        const { state, hails } = createQueue();
        state.prompt = new PromptState('Stranded Lead', 'Well?', [{ id: 'yes', label: 'Yes' }], state.currentTime, state.currentTime + 20_000);

        hails.say('Warden Cruiser Assize', withdrawing);

        expect(state.hail).toMatchObject({ text: withdrawing });
    });

    it('moves on from a line that something else has cleared', () => {
        const { state, hails } = createQueue();
        hails.say('Warden Cruiser Assize', withdrawing);
        hails.say('Escort One', noQuarter);

        state.hail = null;
        hails.update();

        expect(state.hail).toMatchObject({ text: noQuarter });
    });
});
