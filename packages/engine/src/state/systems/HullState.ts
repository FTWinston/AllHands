import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { ShieldTuningEffect, shieldTuningEffects, weaponTraitTunings } from 'common-data/features/ships/utils/shieldStats';
import { Damage } from 'common-data/features/space/types/Damage';
import { NonCrewSystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getShieldCapacity, resolveShieldHit } from 'src/utils/hullShields';
import { CardState } from '../CardState';
import { GameState } from '../GameState';
import { SystemState } from './SystemState';
import type { Ship } from '../Ship';
import type { HullSystemTile } from './engineer/HullSystemTile';

/** Hull cards that are all damaged together, whenever any one of them is damaged, or the shields are knocked out. */
const volatileCardTypes: ReadonlySet<CardType> = new Set<CardType>(['hullVolatileEmitter']);

/**
 * The hull's cards set its shield capacity, and the hull's power level sets how much damage they absorb, and how efficiently (see shieldStats).
 * The shields only recharge between encounters, but some hull cards tune them when played, which lasts a while.
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

    /** The shields' max level. */
    get maxShield() {
        return getShieldCapacity(this.cardPool);
    }

    get shield() {
        return this.hullTile.shield;
    }

    /** The hull's engineer tile, which EngineerState always creates as a HullSystemTile, and which holds the shields. */
    private get hullTile() {
        return this.linkedEngineerSystemTile as HullSystemTile;
    }

    protected override cardPoolChanged() {
        this.hullTile.setMaxShield(this.maxShield);
    }

    protected override healthChanged() {
        // Damaged cards don't count towards the shields' capacity.
        this.hullTile.setMaxShield(this.maxShield);
    }

    /** Fully charge the shields, and clear any shield tuning and scrambling, e.g. at the start of an encounter. */
    restoreShields() {
        this.hullTile.removeEffect('shieldScrambled', 'expired');
        this.clearShieldTuning();
        this.hullTile.setShield(this.maxShield);
    }

    /**
     * Called as a hull card that tunes the shields is played. This replaces any other tuning, and lasts until it times out.
     * Playing a card with the current tuning restarts its timer.
     * While scrambled, the shields can't be tuned, and the scrambling wears off by one for each card that tries.
     */
    tuneShields(tuning: ShieldTuningEffect) {
        const tile = this.hullTile;

        if (tile.hasEffect('shieldScrambled')) {
            tile.adjustEffectLevel('shieldScrambled', -1);
            return;
        }

        for (const effect of shieldTuningEffects) {
            if (effect !== tuning) {
                tile.removeEffect(effect, 'early');
            }
        }

        // Restarts the tuning's duration, if the shields already had it.
        tile.addEffect(tuning);
    }

    private clearShieldTuning() {
        for (const effect of shieldTuningEffects) {
            this.hullTile.removeEffect(effect, 'early');
        }
    }

    /** Cancel the shields' tuning, and stop hull cards setting another until that many more have tried, e.g. when enemy sensors disrupt the shields. */
    scrambleShields(cards: number | undefined) {
        this.clearShieldTuning();
        this.hullTile.adjustEffectLevel('shieldScrambled', cards ?? 0);
    }

    protected override cardDamaged(card: CardState) {
        if (volatileCardTypes.has(card.type)) {
            this.damageVolatileCards();
        }
    }

    private damageVolatileCards() {
        this.damageSpecificCards(card => volatileCardTypes.has(card.type));
    }

    /**
     * Apply incoming damage to the shields first, reducing their levels as necessary, and return the remaining damage to be done to the ship itself.
     * While they last, the shields absorb a share of each hit, set by the hull's power level, and their tuning can reduce the hit or how much it drains them (see resolveShieldHit).
     * If the hit knocks the shields out, every volatile hull card is damaged.
     */
    damageShields(damage: Damage): number {
        const tile = this.hullTile;

        const result = resolveShieldHit(damage.amount, this.shield, this.maxShield, this.powerLevel, {
            tuned: damage.traits.some((trait) => {
                const tuning = weaponTraitTunings[trait];
                return tuning !== undefined && tile.hasEffect(tuning);
            }),
            reinforced: tile.hasEffect('shieldReinforced'),
        });

        if (result.drain > 0) {
            tile.setShield(this.shield - result.drain);

            if (this.shield <= 0) {
                this.damageVolatileCards();
            }
        }

        const targetSystem = this.getShip().getSystem(damage.targetSystem ?? 'hull');

        // Scale pass-through damage by target system's shield pass-through modifier, which is a percentage.
        return Math.round(result.passedThrough * targetSystem.shieldPassThroughModifier / 100);
    }

    override adjustHealth(adjustment: number) {
        super.adjustHealth(adjustment);

        if (this.health <= 0) {
            this.getShip().destroy();
        }
    }
}
