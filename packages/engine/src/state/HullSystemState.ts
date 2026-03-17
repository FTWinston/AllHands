import { Damage, DamageType } from 'common-data/features/space/types/Damage';
import { SystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { BindableEvent } from '../classes/BindableEvent';
import { GameState } from './GameState';
import { SystemState } from './SystemState';
import type { Ship } from './Ship';

const damageTypeScales: Record<DamageType, { drain: number; pen: number }> = {
    coherent: { drain: 1.0, pen: 0.0 },
    disruptor: { drain: 1.4, pen: 0.0 },
    ion: { drain: 2.5, pen: -0.2 }, // High drain, low pen
    plasma: { drain: 0.8, pen: 0.1 },
    antimatter: { drain: 1.0, pen: 0.2 },
    tachyon: { drain: 0.5, pen: 0.4 }, // High pen, low drain
};

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
    damageShields(damage: Damage): number {
        const damageType = damageTypeScales[damage.damageType];

        const shieldStrengthFraction = this.linkedEngineerSystemTile.getEffectLevel('shield') / 100;

        // Nonlinear falloff so that higher shield levels are disproportionately more effective.
        let passThroughFraction = Math.pow(1 - shieldStrengthFraction, 2) + damageType.pen;
        passThroughFraction = Math.max(0, Math.min(1, passThroughFraction)); // Clamp 0-1

        const passThroughDamage = Math.round(damage.amount * passThroughFraction);
        const absorbedByShields = Math.round((damage.amount - passThroughDamage) * damageType.drain);

        this.linkedEngineerSystemTile.adjustEffectLevel('shield', -absorbedByShields);

        const targetSystem = this.getShip().getSystem(damage.targetSystem ?? 'hull');

        // Scale pass-through damage by target system's shield pass-through modifier, which is a percentage.
        return Math.round(passThroughDamage * targetSystem.shieldPassThroughModifier / 100);
    }

    override adjustHealth(adjustment: number) {
        super.adjustHealth(adjustment);

        if (this.health <= 0) {
            this.getShip().destroy();
        }
    }
}
