import { entity } from '@colyseus/schema';
import { AiShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ShipAiController } from '../ai/ShipAiController';
import { GameState } from './GameState';
import { Ship } from './Ship';

@entity
export class AiShip extends Ship {
    private readonly aiController: ShipAiController;

    constructor(gameState: GameState, setup: AiShipSetupInfo) {
        super(gameState, setup);

        this.aiController = new ShipAiController(this, {
            personality: setup.personality,
            reactionMultiplier: setup.reactionMultiplier,
        });
    }

    public override tick(deltaTime: number): void {
        super.tick(deltaTime);

        // Pass current time from the game clock to the AI controller
        const currentTime = this.gameState.clock.currentTime;
        this.aiController.update(deltaTime, currentTime);
    }
}
