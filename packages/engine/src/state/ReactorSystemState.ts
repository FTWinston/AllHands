import { SystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { GameState } from './GameState';
import { SystemState } from './SystemState';
import type { Ship } from './Ship';

export class ReactorSystemState extends SystemState {
    constructor(setup: SystemSetupInfo, gameState: GameState, ship: Ship) {
        super(setup, gameState, ship);
    }

    /**
     * Add an "aux power" card to the engineer's hand, if they don't already have one, and the hand isn't full.
     */
    override performGenerate(): void {
        const engineerState = this.getShip().engineerState;

        if (engineerState.hand.some(card => card.type === 'auxPower')) {
            return;
        }

        engineerState.addCard('auxPower');
    }

    override adjustHealth(value: number): void {
        const oldHealth = this.health;

        super.adjustHealth(value);

        const newHealth = this.health;

        if (newHealth !== oldHealth) {
            // The engineer system needs told when reactor health changes
            this.getShip().engineerState.onReactorHealthChanged(newHealth, this.maxHealth);
        }
    }

    override adjustPowerLevel(value: number): void {
        const oldPower = this.powerLevel;

        super.adjustPowerLevel(value);

        const newPower = this.powerLevel;

        if (oldPower !== newPower) {
            // The engineer system needs told when reactor power changes
            this.getShip().engineerState.onReactorPowerChanged(this.getGameState().clock.currentTime);
        }
    }
}
