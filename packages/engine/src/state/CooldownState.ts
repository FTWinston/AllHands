import { Schema, type } from '@colyseus/schema';
import { Cooldown } from 'common-data/types/Cooldown';

export class CooldownState extends Schema implements Cooldown {
    constructor(startTime: number, endTime: number) {
        super();
        this.startTime = startTime;
        this.endTime = endTime;
    }

    @type('number') startTime: number;
    @type('number') endTime: number;

    /**
     * Create a new CooldownState with a specific end time, preserving
     * the progress fraction at the given time.
     */
    rescaledToEnd(currentTime: number, newEnd: number): CooldownState {
        const oldDuration = this.endTime - this.startTime;
        const fraction = oldDuration > 0 ? (currentTime - this.startTime) / oldDuration : 0;
        const newStart = fraction > 0 && fraction < 1
            ? (currentTime - fraction * newEnd) / (1 - fraction)
            : newEnd - oldDuration;
        return new CooldownState(newStart, newEnd);
    }

    /**
     * Create a new CooldownState with a specific duration, preserving
     * the progress fraction at the given time.
     */
    rescaledToDuration(currentTime: number, newDuration: number): CooldownState {
        const oldDuration = this.endTime - this.startTime;
        const fraction = oldDuration > 0
            ? Math.max(0, Math.min((currentTime - this.startTime) / oldDuration, 1))
            : 0;
        const newStart = currentTime - fraction * newDuration;
        return new CooldownState(newStart, newStart + newDuration);
    }
}
