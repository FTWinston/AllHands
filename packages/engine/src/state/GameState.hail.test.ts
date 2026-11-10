import { getHailDuration } from 'common-data/features/sectors/types/HailInfo';
import { setupGameRoom } from 'src/testUtils';
import { describe, expect, it } from 'vitest';

const rooms = setupGameRoom();

const line = 'Cost exceeds mandate. Withdrawing.';

/** Let real time pass for the room's timers, which aren't otherwise running. */
function wait(ms: number) {
    for (const delayed of [...rooms.getClock().delayed]) {
        if (delayed.active) {
            delayed.tick(ms);
        }
    }
}

describe('GameState hails', () => {
    it('shows who is speaking and what they said', () => {
        const state = rooms.createState();
        expect(state.hail).toBeNull();

        state.showHail('Warden Cruiser Assize', line);

        expect(state.hail).toMatchObject({ speaker: 'Warden Cruiser Assize', text: line });
    });

    it('clears itself once there has been time to read it', () => {
        const state = rooms.createState();
        state.showHail('Warden Cruiser Assize', line);

        wait(getHailDuration(line) - 1);
        expect(state.hail).not.toBeNull();

        wait(1);
        expect(state.hail).toBeNull();
    });

    it('stays for longer the more there is to read', () => {
        expect(getHailDuration(line.repeat(4))).toBeGreaterThan(getHailDuration(line) * 2);
    });

    it('is replaced by whatever is said next, which then gets its own full time', () => {
        const state = rooms.createState();
        const reply = 'Assize is gone. No quarter.';

        state.showHail('Warden Cruiser Assize', line);
        wait(getHailDuration(line) - 1);
        state.showHail('Escort One', reply);
        expect(state.hail).toMatchObject({ speaker: 'Escort One', text: reply });

        // The first hail's time is up, but that's not what's showing any more.
        wait(1);
        expect(state.hail).toMatchObject({ speaker: 'Escort One' });

        wait(getHailDuration(reply) - 1);
        expect(state.hail).toBeNull();
    });

    it('gives just as long to read it when the game clock runs faster', () => {
        const state = rooms.createState();
        state.timeScale = 2;
        state.showHail('Warden Cruiser Assize', line);

        wait(getHailDuration(line) - 1);
        expect(state.hail).not.toBeNull();

        wait(1);
        expect(state.hail).toBeNull();
    });
});
