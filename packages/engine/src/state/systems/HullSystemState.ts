import { Damage } from 'common-data/features/space/types/Damage';
import { NonCrewSystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { InterceptableAction } from 'src/classes/InterceptableAction';
import { CardState } from '../CardState';
import { GameState } from '../GameState';
import { SystemState } from './SystemState';
import type { Ship } from '../Ship';

export class HullSystemState extends SystemState {
    constructor(setup: NonCrewSystemSetupInfo, gameState: GameState, ship: Ship, getCardId: () => number) {
        const cards = Array.from({ length: setup.numCards }, () => new CardState(getCardId(), 'hullPlaceholder'));

        super(setup, gameState, ship, cards, 1);
    }

    override generate = new InterceptableAction(() => {
        // TODO: play a card, draw a card?
        this.linkedEngineerSystemTile.adjustEffectLevel('shield', this.powerLevel);
    });

    /**
     * Apply incoming damage to the shields first, reducing their levels as necessary,
     * and return the remaining damage to be done to the ship itself.
     */
    damageShields(damage: Damage): number {
        // TODO: Revisit shield scaling based on weapon traits when new card traits are added for damage types.
        // const damageType = damageTypeScales[damage.damageType];
        const damageTypeScale = { drain: 1.0, pen: 0.0 };

        const shieldStrengthFraction = this.linkedEngineerSystemTile.getEffectLevel('shield') / 100;

        // Nonlinear falloff so that higher shield levels are disproportionately more effective.
        let passThroughFraction = Math.pow(1 - shieldStrengthFraction, 2) + damageTypeScale.pen;
        passThroughFraction = Math.max(0, Math.min(1, passThroughFraction)); // Clamp 0-1

        const passThroughDamage = Math.round(damage.amount * passThroughFraction);
        const absorbedByShields = Math.round((damage.amount - passThroughDamage) * damageTypeScale.drain);

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
