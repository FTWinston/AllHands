import { Schema, type } from '@colyseus/schema';

export class MotionKeyframe extends Schema {
    @type('number') time: number;
    @type('number') x: number;
    @type('number') y: number;
    @type('number') angle: number;

    constructor(time: number, x: number, y: number, angle: number) {
        super();
        this.time = time;
        this.x = x;
        this.y = y;
        this.angle = angle;
    }
}
