import { MAX_POWER_LEVEL } from './systemEffectDefinitions';
import type { CardType } from 'src/features/cards/utils/cardDefinitions';
import type { WeaponType } from 'src/features/space/types/Damage';

/**
 * A type of weapon that a ship's shields can be tuned against.
 * Shields recharge only between encounters, but each hull card that's drawn adds a bonus that the next hit uses up.
 */
export type ShieldTuning = WeaponType;

export const shieldTunings: readonly ShieldTuning[] = ['energy', 'torpedo'];

/** The hull effect that shows the shields are tuned against each weapon type. */
export const shieldTuningEffects = {
    energy: 'shieldTunedEnergy',
    torpedo: 'shieldTunedTorpedo',
} as const satisfies Record<ShieldTuning, string>;

/** The hull cards that tune the shields when drawn, and what they tune them against. */
export const shieldTuningCards: Partial<Record<CardType, ShieldTuning>> = {
    hullShieldTuningEnergy: 'energy',
    hullShieldTuningTorpedo: 'torpedo',
};

/** The hull effects that drawing hull cards builds up, each of which the next hit it applies to uses up. */
export const hitBonusEffects = ['shieldReinforced', 'hullBraced', ...Object.values(shieldTuningEffects)] as const;

export type HitBonusEffect = typeof hitBonusEffects[number];

/** How much less each level of Reinforced drains from the shields, of the damage they absorb. */
export const reinforcedPerLevel = 5;

/** How much less damage gets past the shields, for each level of Braced. */
export const bracedPerLevel = 5;

/** How much less damage a hit of a weapon type does, for each level of tuning against it. */
export const tunedPerLevel = 10;

/** The most of any one hit, as a percentage, that hit bonuses can prevent between them. */
export const maxPreventedPercent = 50;

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

/**
 * The percentage of each hit's damage that the shields absorb, while they last.
 * Full shields absorb from 60% at hull power 1 to all of it at full power, and unpowered shields absorb nothing.
 * Emptier shields absorb less: `fullness` (0-1) scales this, with a falloff that makes fuller shields disproportionately effective.
 */
export function getShieldAbsorption(powerLevel: number, fullness: number): number {
    if (powerLevel <= 0) {
        return 0;
    }

    const clampedFullness = Math.max(0, Math.min(1, fullness));
    const absorption = (50 + 10 * Math.min(powerLevel, MAX_POWER_LEVEL)) * (1 - Math.pow(1 - clampedFullness, 2));

    return Math.round(Math.max(0, Math.min(100, absorption)));
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
