import { Schema, type, MapSchema } from '@colyseus/schema';

import { GameStatus } from '../types/GameStatus';

import { CrewState } from './CrewState';
import { ShipState } from './ShipState';

export class GameState extends Schema {
    @type('string') gameStatus: GameStatus = 'setup';
    @type({ map: CrewState }) crews = new MapSchema<CrewState>();
    @type({ map: ShipState }) ships = new MapSchema<ShipState>();
}
