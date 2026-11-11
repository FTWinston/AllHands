import { getHailDuration, minHailDuration } from 'common-data/features/sectors/types/HailInfo';
import { HailState } from 'src/state/HailState';
import type { GameState } from 'src/state/GameState';

export interface HailOptions {
    /**
     * Said ahead of anything that's waiting, and cuts short whatever is being said, once that's been up for `minHailDuration`.
     * For warnings that are no use late, like a turn about to be made. Urgent hails never cut each other short.
     */
    urgent?: boolean;
    /** How long it can wait to be said, in game time, before it's dropped as out of date. Left out, it waits as long as it takes. */
    maxDelayMs?: number;
}

interface QueuedHail {
    speaker: string;
    text: string;
    urgent: boolean;
    /** Game time after which it's no longer worth saying, if it hasn't been said by then. */
    expiresAt: number;
}

interface ShownHail {
    state: HailState;
    urgent: boolean;
    /** How long it needs to be up to be read, in real milliseconds. */
    duration: number;
    /** How long it's been up so far, in real milliseconds. */
    elapsed: number;
}

/**
 * What an encounter has to say over comms, one line at a time, each up for as long as it takes to read.
 * How long a line has been up is counted in real time, however fast the game clock is running, or however its speed changes:
 * a faster clock gives less time to talk, not less time to read.
 * Lines carry on while the crew is being asked something: the viewscreen shows them above the question.
 */
export class HailQueue {
    private readonly waiting: QueuedHail[] = [];
    private shown: ShownHail | null = null;
    /** The game time when `update` last ran. */
    private lastUpdate: number;

    constructor(private readonly state: GameState) {
        this.lastUpdate = state.currentTime;
    }

    /** Whether anything is being said, or waiting to be. */
    get isBusy(): boolean {
        return this.shown !== null || this.waiting.length > 0;
    }

    say(speaker: string, text: string, { urgent = false, maxDelayMs = Infinity }: HailOptions = {}): void {
        const hail: QueuedHail = { speaker, text, urgent, expiresAt: this.state.currentTime + maxDelayMs };

        if (urgent) {
            // Behind any other urgent ones, but ahead of everything else.
            const index = this.waiting.findIndex(waiting => !waiting.urgent);
            this.waiting.splice(index === -1 ? this.waiting.length : index, 0, hail);
        } else {
            this.waiting.push(hail);
        }

        this.update();
    }

    /** Cuts off whatever is being said, and drops everything that was waiting to be. */
    silence(): void {
        this.waiting.length = 0;

        if (this.shown && this.state.hail === this.shown.state) {
            this.state.hail = null;
        }

        this.shown = null;
    }

    /** Clears a line that's been up long enough, and shows the next one. Call on every tick. */
    update(): void {
        const now = this.state.currentTime;
        const realElapsed = (now - this.lastUpdate) / this.state.timeScale;
        this.lastUpdate = now;

        // The campaign clears what's being said when the encounter ends.
        if (this.shown && this.state.hail !== this.shown.state) {
            this.shown = null;
        }

        for (let index = this.waiting.length - 1; index >= 0; index--) {
            if (this.waiting[index].expiresAt < now) {
                this.waiting.splice(index, 1);
            }
        }

        if (this.shown) {
            const shown = this.shown;
            shown.elapsed += realElapsed;

            const next = this.waiting[0];
            const cutShort = next?.urgent && !shown.urgent && shown.elapsed >= Math.min(minHailDuration, shown.duration);

            if (shown.elapsed < shown.duration && !cutShort) {
                return;
            }

            this.state.hail = null;
            this.shown = null;
        }

        const next = this.waiting.shift();
        if (!next) {
            return;
        }

        const state = new HailState({ speaker: next.speaker, text: next.text });

        this.state.hail = state;
        this.shown = { state, urgent: next.urgent, duration: getHailDuration(next.text), elapsed: 0 };
    }
}
