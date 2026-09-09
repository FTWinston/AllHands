import { NonCrewSystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { InterceptableAction } from 'src/classes/InterceptableAction';
import { CardState } from '../CardState';
import { GameState } from '../GameState';
import { SystemState } from './SystemState';
import type { Ship } from '../Ship';

export class ReactorSystemState extends SystemState {
    constructor(setup: NonCrewSystemSetupInfo, gameState: GameState, ship: Ship, getCardId: () => number) {
        const cards = Array.from({ length: setup.numCards }, () => new CardState(getCardId(), 'reactorPlaceholder'));

        super(setup, gameState, ship, cards, 1);
    }

    /**
     * Add an "aux power" card to the engineer's hand, if they don't already have one, and the hand isn't full.
     */
    override generate = new InterceptableAction(() => {
        // TODO: play a card, draw a card?

        const engineerState = this.getShip().engineerState;

        if (engineerState.hand.some(card => card.type === 'auxPower')) {
            return;
        }

        engineerState.addCard('auxPower');
    });

    override adjustHealth(value: number): void {
        const oldHealth = this.health;

        super.adjustHealth(value);

        const newHealth = this.health;

        if (newHealth !== oldHealth) {
            // The engineer system needs told when reactor health changes
            this.getShip().engineerState.onReactorHealthChanged(newHealth, this.maxHealth);
        }

        if (newHealth <= 0) {
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
            // Reactor power changes every system's generation duration
            this.getShip().engineerState.onGenerationDurationChanged();
        }
    }
}
