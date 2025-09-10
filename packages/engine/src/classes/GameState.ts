import { Schema, type, MapSchema } from '@colyseus/schema';
import { ShipState } from './ShipState';

export class GameState extends Schema {
    @type({ map: ShipState }) ships = new MapSchema<ShipState>();
}
