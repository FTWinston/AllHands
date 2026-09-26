import { SystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { GameState } from '../GameState';
import { SystemState } from './SystemState';
import type { Ship } from '../Ship';

export class ReactorSystemState extends SystemState {
    constructor(setup: SystemSetupInfo, gameState: GameState, ship: Ship, getCardId: () => number) {
        super(setup, gameState, ship, getCardId);

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
            // Reactor power changes every system's generation duration
            this.getShip().engineerState.onGenerationDurationChanged();
        }
    }

    private lastDrainedSystemFromPowerCard: SystemState | null = null;

    public powerCardDrawn(cardIsDamaged: boolean, associatedSystem: SystemState) {
        // If there's a ship system currently affected by power drain from a damaged power card, remove that effect.
        this.lastDrainedSystemFromPowerCard?.adjustEffectLevel('reducedPower', -1);

        if (cardIsDamaged) {
            // If the drawn card was damaged, then add power drain to its associated system, and remember it so we can clean up later.
            associatedSystem.adjustEffectLevel('reducedPower', 1);
            this.lastDrainedSystemFromPowerCard = associatedSystem;
        } else {
            // If the drawn card wasn't damaged, apply no drain, and don't remember any system for later cleanup.
            this.lastDrainedSystemFromPowerCard = null;
        }
    }
}
