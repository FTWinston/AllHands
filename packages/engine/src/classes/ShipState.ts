import { Schema, type, ArraySchema } from '@colyseus/schema';

export class ShipState extends Schema {
    @type('string') shipId!: string; // unique ID of the ship
    @type('string') ownerId!: string; // sessionId of the ship client

    @type(['string']) crew = new ArraySchema<string>(); // list of crew sessionIds
}
