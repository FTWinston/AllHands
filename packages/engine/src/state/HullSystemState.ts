import { Damage } from 'common-data/features/space/types/Damage';
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
    damageShields(damage: Damage): number {
        let shieldDrainScale: number;
        let shieldPenetrationScale: number;

        switch (damage.damageType) {
            case 'coherent':
                shieldDrainScale = 1;
                shieldPenetrationScale = 0.5;
                break;
            case 'disruptor':
                shieldDrainScale = 0.5;
                shieldPenetrationScale = 0.5;
                break;
            case 'ion':
                shieldDrainScale = 3;
                shieldPenetrationScale = 1;
                break;
            case 'plasma':
                shieldDrainScale = 1;
                shieldPenetrationScale = 0.5;
                break;
            case 'antimatter':
                shieldDrainScale = 2;
                shieldPenetrationScale = 0.25;
                break;
            case 'tachyon':
                shieldDrainScale = 0.5;
                shieldPenetrationScale = 1;
                break;
            default:
                shieldDrainScale = 1;
                shieldPenetrationScale = 2;
                break;
        }

        const shieldStrengthFraction = this.linkedEngineerSystemTile.getEffectLevel('shield') / 100;
        const passThroughFraction = Math.pow(1 - shieldStrengthFraction, 2) * shieldPenetrationScale; // Nonlinear falloff so that higher shield levels are disproportionately more effective.

        const passThroughDamage = Math.round(damage.amount * passThroughFraction);
        const absorbedByShields = Math.round((damage.amount - passThroughDamage) * shieldDrainScale);

        this.linkedEngineerSystemTile.adjustEffectLevel('shield', -absorbedByShields);

        return passThroughDamage;
    }

    override adjustHealth(adjustment: number) {
        super.adjustHealth(adjustment);

        if (this.health <= 0) {
            // TODO: destroy ship
        }
    }
}
