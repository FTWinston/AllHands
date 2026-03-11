import { SystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { BindableEvent } from 'src/classes/BindableEvent';
import { GameState } from './GameState';
import { SystemState } from './SystemState';
import type { Ship } from './Ship';

export class HullSystemState extends SystemState {
    constructor(setup: SystemSetupInfo, gameState: GameState, ship: Ship) {
        super(setup, gameState, ship);
    }

    override generate = new BindableEvent<() => void>(() => {
        this.linkedEngineerSystemTile.adjustEffectLevel('shield', this.powerLevel);
    });

    /**
     * Apply incoming damage to the shields first, reducing their levels as necessary,
     * and return the remaining damage to be done to the ship itself.
     */
    damageShields(incomingDamage: number): number {
        const shieldStrengthFraction = this.linkedEngineerSystemTile.getEffectLevel('shield') / 100;
        const passThroughFraction = Math.pow(1 - shieldStrengthFraction, 2); // Nonlinear falloff so that higher shield levels are disproportionately more effective.

        const passThroughDamage = Math.round(incomingDamage * passThroughFraction);
        const absorbedByShields = incomingDamage - passThroughDamage;

        this.linkedEngineerSystemTile.adjustEffectLevel('shield', -absorbedByShields);

        return passThroughDamage;
    }
}
