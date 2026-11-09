import { MAX_POWER_LEVEL } from './systemEffectDefinitions';
import type { WeaponType } from 'src/features/space/types/Damage';

/**
 * A type of weapon that a ship's shields can be tuned against.
 * Shields recharge only between encounters, but each hull card that's drawn adds a bonus that the next hit uses up (see the engine's hullShields).
 */
export type ShieldTuning = WeaponType;

export const shieldTunings: readonly ShieldTuning[] = ['energy', 'torpedo'];

/** The hull effect that shows the shields are tuned against each weapon type. */
export const shieldTuningEffects = {
    energy: 'shieldTunedEnergy',
    torpedo: 'shieldTunedTorpedo',
} as const satisfies Record<ShieldTuning, string>;

/** How much less each level of Reinforced drains from the shields, of the damage they absorb. */
export const reinforcedPerLevel = 5;

/** How much less damage gets past the shields, for each level of Braced. */
export const bracedPerLevel = 5;

/** How much less damage a hit of a weapon type does, for each level of tuning against it. */
export const tunedPerLevel = 10;

/** The most of any one hit, as a percentage, that hit bonuses can prevent between them. */
export const maxPreventedPercent = 50;

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
