import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getShieldAbsorption, getShieldCapacity, ShieldTuning, shieldTuningCards, shieldTuningEffects, shieldTunings } from 'common-data/features/ships/utils/shieldStats';
import { LeveledSystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { Damage } from 'common-data/features/space/types/Damage';
import { NonCrewSystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CardState } from '../CardState';
import { GameState } from '../GameState';
import { SystemState } from './SystemState';
import type { Ship } from '../Ship';

/** Hull cards that are all damaged together, whenever any one of them is damaged, or the shields are knocked out. */
const volatileCardTypes: ReadonlySet<CardType> = new Set<CardType>(['hullVolatileEmitter']);

/**
 * The hull's cards set its shield capacity, and the hull's power level sets how much damage they absorb (see shieldStats).
 * The shields only recharge between encounters, but each hull card that's drawn retunes them.
 */
export class HullState extends SystemState {
    constructor(setup: NonCrewSystemSetupInfo, gameState: GameState, ship: Ship, initialPowerLevel: number, getCardId: () => number) {
        super(setup, 'hull', gameState, ship, initialPowerLevel, getCardId);

        this.cardAddedToHand.addListener('hull', (card) => {
            this.retuneShields(card);

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

    /** The weapon type that the shields are currently tuned against, if any. */
    get shieldTuning(): ShieldTuning | null {
        const tile = this.linkedEngineerSystemTile;
        return shieldTunings.find(tuning => tile.hasEffect(shieldTuningEffects[tuning])) ?? null;
    }

    override getEffectMaxLevel(effectType: LeveledSystemEffectType): number | undefined {
        return effectType === 'shield'
            ? this.maxShield
            : undefined;
    }

    protected override cardPoolChanged() {
        this.linkedEngineerSystemTile.refreshEffectMaxLevel('shield');
    }

    protected override healthChanged() {
        // Damaged cards don't count towards the shields' capacity.
        this.linkedEngineerSystemTile.refreshEffectMaxLevel('shield');
    }

    /** Fully charge the shields, and clear their tuning, e.g. at the start of an encounter. */
    restoreShields() {
        const tile = this.linkedEngineerSystemTile;
        tile.removeEffect('shieldScrambled', false);
        this.setShieldTuning(null);
        tile.adjustEffectLevel('shield', this.maxShield - this.shield);
    }

    /**
     * Called as each hull card is drawn. An undamaged tuning card tunes the shields against its weapon type, and any other card leaves them untuned.
     * While scrambled, the shields stay untuned, and the scrambling wears off by one draw.
     */
    private retuneShields(card: CardState) {
        const tile = this.linkedEngineerSystemTile;

        if (tile.hasEffect('shieldScrambled')) {
            tile.adjustEffectLevel('shieldScrambled', -1);
            this.setShieldTuning(null);
            return;
        }

        this.setShieldTuning(card.isDamaged ? null : shieldTuningCards[card.type] ?? null);
    }

    private setShieldTuning(tuning: ShieldTuning | null) {
        const tile = this.linkedEngineerSystemTile;

        for (const other of shieldTunings) {
            if (other !== tuning) {
                tile.removeEffect(shieldTuningEffects[other], false);
            }
        }

        if (tuning && !tile.hasEffect(shieldTuningEffects[tuning])) {
            tile.addEffect(shieldTuningEffects[tuning]);
        }
    }

    /** Clear the shields' tuning, and stop them being tuned again until that many more hull cards are drawn, e.g. when enemy sensors disrupt them. */
    scrambleShields(draws: number | undefined) {
        this.setShieldTuning(null);
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
     * While they last, the shields absorb a share of each hit, set by the hull's power level, how full they are, and their tuning. If this knocks them out, every volatile hull card is damaged.
     */
    damageShields(damage: Damage): number {
        const maxShield = this.maxShield;
        const fullness = maxShield > 0 ? this.shield / maxShield : 0;
        const absorption = getShieldAbsorption(this.powerLevel, fullness, this.shieldTuning, damage.weaponType);
        const absorbed = Math.min(this.shield, Math.round(damage.amount * absorption / 100));

        if (absorbed > 0) {
            this.linkedEngineerSystemTile.adjustEffectLevel('shield', -absorbed);

            if (this.shield <= 0) {
                this.damageVolatileCards();
            }
        }

        const targetSystem = this.getShip().getSystem(damage.targetSystem ?? 'hull');

        // Scale pass-through damage by target system's shield pass-through modifier, which is a percentage.
        return Math.round((damage.amount - absorbed) * targetSystem.shieldPassThroughModifier / 100);
    }

    override adjustHealth(adjustment: number) {
        super.adjustHealth(adjustment);

        if (this.health <= 0) {
            this.getShip().destroy();
        }
    }
}
