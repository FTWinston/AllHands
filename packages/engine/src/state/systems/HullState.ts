import { LeveledSystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { Damage } from 'common-data/features/space/types/Damage';
import { NonCrewSystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { GameState } from '../GameState';
import { SystemState } from './SystemState';
import type { Ship } from '../Ship';

/**
 * The hull's cards alone set its shield stats. Emitters give capacity, and add to the recharge delay, even when damaged.
 * Regenerators add to the charge, and delay reduction cards take from the recharge delay, only while undamaged.
 */
export class HullState extends SystemState {
    constructor(setup: NonCrewSystemSetupInfo, gameState: GameState, ship: Ship, initialPowerLevel: number, getCardId: () => number) {
        super(setup, 'hull', gameState, ship, initialPowerLevel, getCardId);

        this.cardAddedToHand.addListener('hull', (card) => {
            // Immediately after drawing a card, try to play it, and discard it if that fails for any reason, such as it being damaged.
            if (!this.playCard(card.id, card.type, 'no-target', '')) {
                this.discard();
            }
        });
    }

    override readonly maxHandSize = 1;

    private sumCardParameter(parameter: string, includeDamaged: boolean) {
        let total = 0;

        for (const card of this.cardPool) {
            if (includeDamaged || !card.isDamaged) {
                total += card.getParameter(parameter);
            }
        }

        return total;
    }

    /** The shields' max level. */
    get maxShield() {
        return Math.max(0, this.sumCardParameter('shieldCapacity', true));
    }

    /** How much the shields recharge by, each time an undamaged hull card is drawn. Nothing while the hull is unpowered. */
    get shieldCharge() {
        if (this.powerLevel <= 0) {
            return 0;
        }

        return Math.max(0, this.sumCardParameter('shieldCharge', false) + this.powerLevel);
    }

    /** How many undamaged hull cards must be drawn after the shields are hit, before they start recharging again. */
    get shieldRechargeDelay() {
        return Math.max(0, this.sumCardParameter('shieldRechargeDelay', true) - this.sumCardParameter('shieldDelayReduction', false));
    }

    get shield() {
        return this.linkedEngineerSystemTile.getEffectLevel('shield');
    }

    override getEffectMaxLevel(effectType: LeveledSystemEffectType): number | undefined {
        return effectType === 'shield'
            ? this.maxShield
            : undefined;
    }

    protected override cardPoolChanged() {
        this.linkedEngineerSystemTile.refreshEffectMaxLevel('shield');
    }

    /** Fully charge the shields, e.g. at the start of an encounter. */
    restoreShields() {
        const tile = this.linkedEngineerSystemTile;
        tile.removeEffect('shieldRecovering', false);
        tile.adjustEffectLevel('shield', this.maxShield - this.shield);
    }

    /**
     * Called whenever an undamaged hull card is drawn (and so played).
     * Recharges the shields, unless they're still recovering from being hit, in which case that recovery progresses instead.
     */
    tickShieldRecharge() {
        const tile = this.linkedEngineerSystemTile;

        if (tile.hasEffect('shieldRecovering')) {
            tile.adjustEffectLevel('shieldRecovering', -1);
            return;
        }

        tile.adjustEffectLevel('shield', this.shieldCharge);
    }

    /** Add to the countdown until the shields start recharging again, e.g. when enemy sensors disrupt them. */
    delayShieldRecovery(draws: number | undefined) {
        this.linkedEngineerSystemTile.adjustEffectLevel('shieldRecovering', draws ?? 0);
    }

    /** Restart the countdown until the shields start recharging again, without shortening a longer one that's already running. */
    private restartShieldRecovery() {
        const tile = this.linkedEngineerSystemTile;
        const remaining = tile.getEffectLevel('shieldRecovering');
        tile.adjustEffectLevel('shieldRecovering', Math.max(0, this.shieldRechargeDelay - remaining));
    }

    /**
     * Apply incoming damage to the shields first, reducing their levels as necessary,
     * and return the remaining damage to be done to the ship itself.
     */
    damageShields(damage: Damage): number {
        // TODO: Revisit shield scaling based on weapon traits when new card traits are added for damage types.
        // const damageType = damageTypeScales[damage.damageType];
        const damageTypeScale = { drain: 1.0, pen: 0.0 };

        const maxShield = this.maxShield;
        const shieldStrengthFraction = maxShield > 0 ? this.shield / maxShield : 0;

        // Nonlinear falloff so that higher shield levels are disproportionately more effective.
        let passThroughFraction = Math.pow(1 - shieldStrengthFraction, 2) + damageTypeScale.pen;
        passThroughFraction = Math.max(0, Math.min(1, passThroughFraction)); // Clamp 0-1

        const passThroughDamage = Math.round(damage.amount * passThroughFraction);
        const absorbedByShields = Math.round((damage.amount - passThroughDamage) * damageTypeScale.drain);

        this.linkedEngineerSystemTile.adjustEffectLevel('shield', -absorbedByShields);

        if (damage.amount > 0) {
            this.restartShieldRecovery();
        }

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
