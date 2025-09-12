import { Schema, type, MapSchema } from '@colyseus/schema';
import { ShipState } from './ShipState';
import { GameStatus } from '../types/GameStatus';

export class GameState extends Schema {
    @type('string') gameStatus: GameStatus = 'setup';
    @type({ map: ShipState }) ships = new MapSchema<ShipState>();
}
