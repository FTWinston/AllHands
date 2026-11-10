import { MAX_POWER_LEVEL } from './systemEffectDefinitions';
import type { WeaponType } from 'src/features/space/types/Damage';

/**
 * A type of weapon that a ship's shields can be tuned against.
 * Shields recharge only between encounters, but each hull card that's drawn can switch them into a mode for a while (see the engine's hullShields).
 */
export type ShieldTuning = WeaponType;

export const shieldTunings: readonly ShieldTuning[] = ['energy', 'torpedo'];

/** The hull effect that shows the shields are tuned against each weapon type. */
export const shieldTuningEffects = {
    energy: 'shieldTunedEnergy',
    torpedo: 'shieldTunedTorpedo',
} as const satisfies Record<ShieldTuning, string>;

/**
 * The hull effects that are shield modes. Drawing a hull card that sets a mode replaces any other, so only one is ever active.
 * Each lasts for its effect definition's duration, unless another draw renews or replaces it.
 */
export const shieldModeEffects = ['shieldReinforced', shieldTuningEffects.energy, shieldTuningEffects.torpedo] as const;

export type ShieldModeEffect = typeof shieldModeEffects[number];

/** While the shields are reinforced, they're drained by this percentage of what they otherwise would be. */
export const reinforcedDrainPercent = 75;

/** The percentage by which a hit is reduced, while the shields are tuned against its weapon type. */
export const tunedReductionPercent = 40;

/** Shields that a hit leaves below this percentage of their capacity collapse, losing what's left. */
export const shieldCollapsePercent = 10;

/**
 * The percentage of each hit's damage that the shields absorb, while they last.
 * They absorb from 60% at hull power 1 to all of it at full power, and nothing while the hull is unpowered.
 */
export function getShieldAbsorption(powerLevel: number): number {
    return powerLevel <= 0
        ? 0
        : 50 + 10 * Math.min(powerLevel, MAX_POWER_LEVEL);
}

/**
 * How much the shields are drained by the damage they absorb, as a percentage of it.
 * More hull power makes them more efficient: from 100% at power 1 to 60% at full power, so the same capacity absorbs more.
 */
export function getShieldDrainPercent(powerLevel: number, reinforced: boolean): number {
    const forPower = 110 - 10 * Math.max(1, Math.min(powerLevel, MAX_POWER_LEVEL));

    return reinforced
        ? forPower * reinforcedDrainPercent / 100
        : forPower;
}
