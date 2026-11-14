import { MAX_POWER_LEVEL } from './powerLevel';
import type { SystemEffectType } from './systemEffectDefinitions';
import type { WeaponTrait } from 'src/features/cards/types/CardTrait';

/**
 * The hull effects that are shield tunings. Shields recharge only between encounters, but each hull card that's played can tune them for a while.
 * Playing one that sets a tuning replaces any other, so only one is ever active.
 * Each lasts for its effect definition's duration, unless another hull card renews or replaces it.
 */
export const shieldTuningEffects = ['shieldReinforced', 'shieldTunedEnergy', 'shieldTunedTorpedo'] as const satisfies readonly SystemEffectType[];

export type ShieldTuningEffect = typeof shieldTuningEffects[number];

/** The shield tuning that reduces hits from weapons with each weapon trait. */
export const weaponTraitTunings: Partial<Record<WeaponTrait, ShieldTuningEffect>> = {
    energyWeapon: 'shieldTunedEnergy',
    torpedoWeapon: 'shieldTunedTorpedo',
};

/** While the shields are reinforced, they're drained by this percentage of what they otherwise would be. */
export const reinforcedDrainPercent = 75;

/** The percentage by which a hit is reduced, while the shields are tuned against one of its weapon traits. */
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
