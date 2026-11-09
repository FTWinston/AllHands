import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { bracedPerLevel, getShieldAbsorption, maxPreventedPercent, reinforcedPerLevel, ShieldTuning, shieldTuningEffects, tunedPerLevel } from 'common-data/features/ships/utils/shieldStats';

/** The hull cards that tune the shields when drawn, and what they tune them against. */
export const shieldTuningCards: Partial<Record<CardType, ShieldTuning>> = {
    hullShieldTuningEnergy: 'energy',
    hullShieldTuningTorpedo: 'torpedo',
};

/** The hull effects that drawing hull cards builds up, each of which the next hit it applies to uses up. */
export const hitBonusEffects = ['shieldReinforced', 'hullBraced', ...Object.values(shieldTuningEffects)] as const;

/** What's needed of a hull card, to work out what it contributes to the shields. */
export interface ShieldStatCard {
    readonly isDamaged: boolean;
    getParameter(parameter: string): number;
}

/** The shields' capacity: the total of every undamaged hull card's. */
export function getShieldCapacity(cards: Iterable<ShieldStatCard>): number {
    let total = 0;

    for (const card of cards) {
        if (!card.isDamaged) {
            total += card.getParameter('shieldCapacity');
        }
    }

    return Math.max(0, total);
}

/** The levels of each hit bonus that could apply to a hit. */
export interface HitBonusLevels {
    reinforced: number;
    braced: number;
    /** Levels of tuning against the hit's weapon type. */
    tuned: number;
}

export interface ShieldHitResult {
    /** How much the shields are drained by. */
    drain: number;
    /** The damage that gets past the shields. */
    passedThrough: number;
    /** How much damage each bonus prevented. Each bonus that prevented any is used up by the hit. */
    prevented: HitBonusLevels;
}

/**
 * Work out how a hit is split between the shields and what gets past them, given the hit bonuses that are built up.
 * - Tuning against the hit's weapon type reduces the hit itself.
 * - The shields then absorb a share of what's left, and Reinforced reduces how much of that drains them.
 * - Braced then reduces the damage that gets past the shields.
 * Between them, the bonuses never prevent more than `maxPreventedPercent` of the hit. A bonus that this leaves with nothing to prevent isn't used up.
 */
export function resolveShieldHit(amount: number, shield: number, maxShield: number, powerLevel: number, bonuses: HitBonusLevels): ShieldHitResult {
    let budget = Math.floor(amount * maxPreventedPercent / 100);
    const prevent = (wanted: number) => {
        const prevented = Math.max(0, Math.min(wanted, budget));
        budget -= prevented;
        return prevented;
    };

    const tuned = prevent(Math.min(amount, bonuses.tuned * tunedPerLevel));
    const remaining = amount - tuned;

    const fullness = maxShield > 0 ? shield / maxShield : 0;
    const absorbed = shield > 0
        ? Math.round(remaining * getShieldAbsorption(powerLevel, fullness) / 100)
        : 0;
    const reinforced = prevent(Math.min(absorbed, bonuses.reinforced * reinforcedPerLevel));
    const drain = Math.min(shield, absorbed - reinforced);

    const unabsorbed = remaining - reinforced - drain;
    const braced = prevent(Math.min(unabsorbed, bonuses.braced * bracedPerLevel));

    return {
        drain,
        passedThrough: unabsorbed - braced,
        prevented: { tuned, reinforced, braced },
    };
}
