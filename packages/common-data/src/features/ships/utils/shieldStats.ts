import { MAX_POWER_LEVEL } from './systemEffectDefinitions';
import type { CardType } from 'src/features/cards/utils/cardDefinitions';
import type { WeaponType } from 'src/features/space/types/Damage';

/**
 * The type of weapon that a ship's shields are tuned against, if any.
 * Shields recharge only between encounters, but each hull card that's drawn retunes them, or leaves them untuned.
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

/** How many more percentage points of damage tuned shields absorb from the weapon type they're tuned against. */
export const shieldTuningBonus = 20;

/** How many fewer percentage points of damage tuned shields absorb from anything else. */
export const shieldTuningPenalty = 10;

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
 * Tuned shields then absorb more from the weapon type they're tuned against, and less from anything else.
 */
export function getShieldAbsorption(powerLevel: number, fullness: number, tuning: ShieldTuning | null, weaponType?: WeaponType): number {
    if (powerLevel <= 0) {
        return 0;
    }

    const clampedFullness = Math.max(0, Math.min(1, fullness));
    let absorption = (50 + 10 * Math.min(powerLevel, MAX_POWER_LEVEL)) * (1 - Math.pow(1 - clampedFullness, 2));

    if (tuning) {
        absorption += weaponType === tuning ? shieldTuningBonus : -shieldTuningPenalty;
    }

    return Math.round(Math.max(0, Math.min(100, absorption)));
}
