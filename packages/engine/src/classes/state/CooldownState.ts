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
}
