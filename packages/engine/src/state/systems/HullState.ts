import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getShieldCapacity, hitBonusEffects, resolveShieldHit, shieldTuningCards, shieldTuningEffects } from 'common-data/features/ships/utils/shieldStats';
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
 * The shields only recharge between encounters, but each hull card that's drawn builds up a hit bonus, which the next hit it applies to uses up.
 */
export class HullState extends SystemState {
    constructor(setup: NonCrewSystemSetupInfo, gameState: GameState, ship: Ship, initialPowerLevel: number, getCardId: () => number) {
        super(setup, 'hull', gameState, ship, initialPowerLevel, getCardId);

        this.cardAddedToHand.addListener('hull', (card) => {
            this.addHitBonus(card);

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

    protected override cardPoolChanged() {
        this.linkedEngineerSystemTile.refreshEffectMaxLevel('shield');
    }

    protected override healthChanged() {
        // Damaged cards don't count towards the shields' capacity.
        this.linkedEngineerSystemTile.refreshEffectMaxLevel('shield');
    }

    /** Fully charge the shields, and clear any hit bonuses and scrambling, e.g. at the start of an encounter. */
    restoreShields() {
        const tile = this.linkedEngineerSystemTile;
        tile.removeEffect('shieldScrambled', false);
        this.clearHitBonuses();
        tile.adjustEffectLevel('shield', this.maxShield - this.shield);
    }

    /**
     * Called as each hull card is drawn. An undamaged card builds up its hit bonus:
     * emitters reinforce the shields, plating braces the hull, and tuning cards tune the shields against a weapon type.
     * While scrambled, cards add no bonus, and the scrambling wears off by one draw.
     */
    private addHitBonus(card: CardState) {
        const tile = this.linkedEngineerSystemTile;

        if (tile.hasEffect('shieldScrambled')) {
            tile.adjustEffectLevel('shieldScrambled', -1);
            return;
        }

        if (card.isDamaged) {
            return;
        }

        tile.adjustEffectLevel('shieldReinforced', card.getParameter('reinforce'));
        tile.adjustEffectLevel('hullBraced', card.getParameter('brace'));

        const tuning = shieldTuningCards[card.type];
        if (tuning) {
            tile.adjustEffectLevel(shieldTuningEffects[tuning], card.getParameter('tune'));
        }
    }

    private clearHitBonuses() {
        for (const effect of hitBonusEffects) {
            this.linkedEngineerSystemTile.removeEffect(effect, false);
        }
    }

    /** Strip every hit bonus, and stop new ones building up until that many more hull cards are drawn, e.g. when enemy sensors disrupt the shields. */
    scrambleShields(draws: number | undefined) {
        this.clearHitBonuses();
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
     * While they last, the shields absorb a share of each hit, set by the hull's power level and how full they are.
     * Hit bonuses that apply to the hit reduce it, and are used up (see resolveShieldHit). If the hit knocks the shields out, every volatile hull card is damaged.
     */
    damageShields(damage: Damage): number {
        const tile = this.linkedEngineerSystemTile;
        const tunedEffect = damage.weaponType ? shieldTuningEffects[damage.weaponType] : null;

        const result = resolveShieldHit(damage.amount, this.shield, this.maxShield, this.powerLevel, {
            reinforced: tile.getEffectLevel('shieldReinforced'),
            braced: tile.getEffectLevel('hullBraced'),
            tuned: tunedEffect ? tile.getEffectLevel(tunedEffect) : 0,
        });

        if (result.prevented.tuned > 0 && tunedEffect) {
            tile.removeEffect(tunedEffect, false);
        }
        if (result.prevented.reinforced > 0) {
            tile.removeEffect('shieldReinforced', false);
        }
        if (result.prevented.braced > 0) {
            tile.removeEffect('hullBraced', false);
        }

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
