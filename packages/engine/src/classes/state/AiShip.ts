import { entity } from '@colyseus/schema';
import { ShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { GameState } from './GameState';
import { Ship } from './Ship';

@entity
export class AiShip extends Ship {
    constructor(gameState: GameState, setup: ShipSetupInfo) {
        super(gameState, setup);
    }
}
