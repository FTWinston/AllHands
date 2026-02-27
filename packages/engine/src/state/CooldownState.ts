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
     * Adjust start and end times, preserving the progress fraction at the given time,
     * adjusting to fit a new end time.
     */
    rescaleToEnd(currentTime: number, newEnd: number) {
        const oldDuration = this.endTime - this.startTime;
        const fraction = oldDuration > 0 ? (currentTime - this.startTime) / oldDuration : 0;
        this.startTime = fraction > 0 && fraction < 1
            ? (currentTime - fraction * newEnd) / (1 - fraction)
            : newEnd - oldDuration;
        this.endTime = newEnd;
    }

    /**
     * Adjust start and end times, preserving the progress fraction at the given time,
     * adjusting to fit a new duration.
     */
    rescaleToDuration(currentTime: number, newDuration: number) {
        const oldDuration = this.endTime - this.startTime;
        const fraction = oldDuration > 0
            ? Math.max(0, Math.min((currentTime - this.startTime) / oldDuration, 1))
            : 0;
        const newStart = currentTime - fraction * newDuration;
        this.startTime = newStart;
        this.endTime = newStart + newDuration;
    }
}
