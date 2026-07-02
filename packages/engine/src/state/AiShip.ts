import { entity } from '@colyseus/schema';
import { GameState } from './GameState';
import { Ship } from './Ship';
import type { ShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';

@entity
export class AiShip extends Ship {
    constructor(gameState: GameState, setup: ShipSetupInfo) {
        super(gameState, setup);
    }

    public override tick(deltaTime: number, currentTime: number): void {
        super.tick(deltaTime, currentTime);

        // TODO: AI controller of some sort should be triggered here.
    }
}
