import { NonCrewSystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CardState } from '../CardState';
import { GameState } from '../GameState';
import { SystemState } from './SystemState';
import type { Ship } from '../Ship';

export class ReactorSystemState extends SystemState {
    constructor(setup: NonCrewSystemSetupInfo, gameState: GameState, ship: Ship, getCardId: () => number) {
        const cards = Array.from({ length: setup.numCards }, () => new CardState(getCardId(), 'reactorAuxPower'));

        super(setup, gameState, ship, cards, 1);

        this.generate.addHandler('reactor', false, () => {
            if (this.hand.length === 0) {
                return;
            }

            const card = this.hand[0];

            // Before drawing a new card, try to play the existing one, and discard it if that fails, e.g. due to it being damaged.
            if (!this.playCard(card.id, card.type, 'no-target', '')) {
                this.discard();
            }
        });
    }

    override readonly maxHandSize = 1;

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
