import { entity } from '@colyseus/schema';
import { ShipAi } from 'src/ai/ShipAi';
import { GameState } from './GameState';
import { Ship } from './Ship';
import type { AiShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';

@entity
export class AiShip extends Ship {
    public readonly ai: ShipAi;

    constructor(gameState: GameState, setup: AiShipSetupInfo) {
        super(gameState, setup);
        this.ai = new ShipAi(this, gameState, setup);
    }

    public override tick(deltaTime: number, currentTime: number): void {
        super.tick(deltaTime, currentTime);
        this.ai.update(currentTime);
    }
}
