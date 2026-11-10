import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { shieldModeEffects, shieldTuningEffects } from 'common-data/features/ships/utils/shieldStats';
import { LeveledSystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { Damage } from 'common-data/features/space/types/Damage';
import { NonCrewSystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getShieldCapacity, resolveShieldHit, shieldModeCards } from 'src/utils/hullShields';
import { CardState } from '../CardState';
import { GameState } from '../GameState';
import { SystemState } from './SystemState';
import type { Ship } from '../Ship';
import type { HullSystemTile } from './engineer/HullSystemTile';

/** Hull cards that are all damaged together, whenever any one of them is damaged, or the shields are knocked out. */
const volatileCardTypes: ReadonlySet<CardType> = new Set<CardType>(['hullVolatileEmitter']);

/**
 * The hull's cards set its shield capacity, and the hull's power level sets how much damage they absorb, and how efficiently (see shieldStats).
 * The shields only recharge between encounters, but each hull card that's drawn can switch them into a mode, which lasts a while.
 */
export class HullState extends SystemState {
    constructor(setup: NonCrewSystemSetupInfo, gameState: GameState, ship: Ship, initialPowerLevel: number, getCardId: () => number) {
        super(setup, 'hull', gameState, ship, initialPowerLevel, getCardId);

        this.cardAddedToHand.addListener('hull', (card) => {
            this.setShieldMode(card);

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
        return this.linkedEngineerSystemTile.getEffectLevel('shield');
    }

    override getEffectMaxLevel(effectType: LeveledSystemEffectType): number | undefined {
        return effectType === 'shield'
            ? this.maxShield
            : undefined;
    }

    /** The hull's engineer tile, which EngineerState always creates as a HullSystemTile. */
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

    /** Fully charge the shields, and clear any shield mode and scrambling, e.g. at the start of an encounter. */
    restoreShields() {
        const tile = this.linkedEngineerSystemTile;
        tile.removeEffect('shieldScrambled', false);
        this.clearShieldMode();
        tile.adjustEffectLevel('shield', this.maxShield - this.shield);
    }

    /**
     * Called as each hull card is drawn. An undamaged emitter or tuning card switches the shields into its mode, replacing any other,
     * and that lasts until it times out. Other cards leave the current mode running.
     * While scrambled, cards set no mode, and the scrambling wears off by one draw.
     */
    private setShieldMode(card: CardState) {
        const tile = this.linkedEngineerSystemTile;

        if (tile.hasEffect('shieldScrambled')) {
            tile.adjustEffectLevel('shieldScrambled', -1);
            return;
        }

        const mode = shieldModeCards[card.type];
        if (!mode || card.isDamaged) {
            return;
        }

        for (const effect of shieldModeEffects) {
            if (effect !== mode) {
                tile.removeEffect(effect, true);
            }
        }

        // Restarts the mode's duration, if the shields were already in it.
        tile.addEffect(mode);
    }

    private clearShieldMode() {
        for (const effect of shieldModeEffects) {
            this.linkedEngineerSystemTile.removeEffect(effect, true);
        }
    }

    /** Cancel the shields' mode, and stop hull cards setting another until that many more are drawn, e.g. when enemy sensors disrupt the shields. */
    scrambleShields(draws: number | undefined) {
        this.clearShieldMode();
        this.linkedEngineerSystemTile.adjustEffectLevel('shieldScrambled', draws ?? 0);
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
     * While they last, the shields absorb a share of each hit, set by the hull's power level, and their mode can reduce the hit or how much it drains them (see resolveShieldHit).
     * If the hit knocks the shields out, every volatile hull card is damaged.
     */
    damageShields(damage: Damage): number {
        const tile = this.linkedEngineerSystemTile;

        const result = resolveShieldHit(damage.amount, this.shield, this.maxShield, this.powerLevel, {
            tuned: damage.weaponType !== undefined && tile.hasEffect(shieldTuningEffects[damage.weaponType]),
            reinforced: tile.hasEffect('shieldReinforced'),
        });

        if (result.drain > 0) {
            tile.adjustEffectLevel('shield', -result.drain);

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
