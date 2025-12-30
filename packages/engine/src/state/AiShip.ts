import { entity } from '@colyseus/schema';
import { AiShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { GameState } from './GameState';
import { Ship } from './Ship';

@entity
export class AiShip extends Ship {
    constructor(gameState: GameState, setup: AiShipSetupInfo) {
        super(gameState, setup);
    }

    public override tick(deltaTime: number): void {
        super.tick(deltaTime);
    }
}
