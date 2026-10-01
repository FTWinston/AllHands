import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { SystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getReactorCardTypeForSystem } from 'src/cards/getReactorCardTypeForSystem';
import { CooldownState } from '../CooldownState';
import { GameState } from '../GameState';
import { SystemState } from './SystemState';
import type { Ship } from '../Ship';

/**
 * Maps the reactor's power level to how long it takes to draw a card (ms).
 */
export const generationDurationByReactorPower = [8_000, 4_000, 2_000, 1_000, 500, 250];

export class ReactorState extends SystemState {
    constructor(setup: SystemSetupInfo, gameState: GameState, ship: Ship, initialPowerLevel: number, getCardId: () => number) {
        super(setup, 'reactor', gameState, ship, initialPowerLevel, getCardId);

        this.cardAddedToHand.addListener('reactor', (card) => {
            // Immediately after drawing a card, try to play it, and discard it if that fails for any reason, such as it being damaged.
            if (!this.playCard(card.id, card.type, 'no-target', '')) {
                this.discard();
            }
        });

        this.drawProgress = new CooldownState(gameState.currentTime, gameState.currentTime + this.getDrawDuration());
    }

    override performScheduledDraw() {
        // When "triggered" to draw a card, instead check if the engineer has an 'auxPower' card, and add one if not.
        // (Actual reactor card drawn is handled by checking drawProgress in update.)
        const engineerState = this.getShip().engineerState;

        if (engineerState.hand.some(card => card.type === 'auxPower')) {
            return true;
        }

        engineerState.addCard('auxPower');
    }

    /** Cooldown tracking progress of drawing reactor cards. */
    private drawProgress: CooldownState;

    update(currentTime: number) {
        // Regularly draw cards. This system is the only one that does this on its own.
        if (this.drawProgress.endTime <= currentTime) {
            this.drawFromTop();
            this.drawProgress.repeat();
        }
    }

    private getDrawDuration(): number {
        return generationDurationByReactorPower[this.powerLevel];
    }

    getDrawTimeForSystemCard(system: ShipSystem): number | null {
        const firstDrawStartTime = this.drawProgress.startTime;
        const drawDuration = this.getDrawDuration();

        let cardType = getReactorCardTypeForSystem(system);

        if (!cardType) {
            return null;
        }

        const firstCardIndexForSystem = this.deck.findIndex(card => card.type === cardType);

        if (firstCardIndexForSystem === -1) {
            return null;
        }

        return firstDrawStartTime + (drawDuration * (firstCardIndexForSystem + 1));
    }

    override readonly maxHandSize = 1;

    override adjustHealth(value: number): void {
        super.adjustHealth(value);

        if (this.health <= 0 && !this.hasEffect('reactorBreach')) {
            this.addEffect('reactorBreach');

            for (const system of this.getShip().engineerState.systems) {
                system.adjustEffectLevel('reducedPower', 99);
            }
        }
    }

    override adjustPowerLevel(value: number): void {
        const oldPower = this.powerLevel;

        super.adjustPowerLevel(value);

        const newPower = this.powerLevel;

        if (oldPower !== newPower) {
            // Recalculate drawProgress based on the new power level, keeping percentage duration the same.
            this.drawProgress.rescaleToDuration(this.getGameState().currentTime, this.getDrawDuration());

            this.getShip().updateCardGeneration();
        }
    }
}
