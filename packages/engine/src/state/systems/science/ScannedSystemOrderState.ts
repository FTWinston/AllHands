import { ArraySchema, Schema, type } from '@colyseus/schema';

export class ScannedSystemOrderState extends Schema {
    @type(['uint8']) order = new ArraySchema<number>(0, 0, 0, 0);
}
