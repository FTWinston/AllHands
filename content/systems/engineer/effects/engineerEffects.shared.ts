import { defineEffects } from 'common-data/content/SharedContent';
import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';
import { extendedShieldsDuration } from 'common-data/features/ships/utils/extendedShields';
import { MAX_POWER_LEVEL } from 'common-data/features/ships/utils/powerLevel';
import {
    autoDestructConfirmationsNeeded, autoDestructConfirmWindow, autoDestructDuration, bankPowerDuration, burnoutDuration, busLinkDuration, chargeMaxLevel, dischargeDuration, emergencyPowerDuration, fluxLimit, railFeedDuration, redlineFluxInterval, runQuietChargeInterval,
    transferPowerDuration, ventShieldsDownDuration,
} from 'content/systems/engineer/cards/engineerCards.shared';

export const effects = defineEffects({
    auxPower: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: 30_000,
    },
    shieldFocus: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: 20_000,
    },
    shieldsExtended: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: extendedShieldsDuration,
    },
    /** On a ship's hull: another ship is powering this one (see the Transfer Power card). It does nothing itself: an encounter decides what that's worth. */
    powerReceived: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: transferPowerDuration,
    },
    /** This system runs lower, and gains Charge on each tick, until it's brought back (see the Run Quiet card). It has no time limit. */
    runningQuiet: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
        tickInterval: runQuietChargeInterval,
    },
    shieldReduced: {
        category: SystemEffectCategory.Negative,
        usesLevels: false,
        duration: 20_000,
    },
    resetting: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: 3_000,
    },
    relocating: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
    },
    overcharge: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: 15_000,
        tickInterval: 1_000,
    },
    distributePowerLoss: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        maxLevel: 3,
        duration: 30_000,
    },
    distributePowerGain: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: 3,
        duration: 30_000,
    },
    drawPowerGain: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: 3,
        duration: 30_000,
    },
    drawPowerLoss: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        maxLevel: 3,
        duration: 30_000,
    },
    divertAllPowerGain: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: MAX_POWER_LEVEL,
        duration: 20_000,
    },
    divertAllPowerLoss: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        maxLevel: 1,
        duration: 20_000,
    },
    divertHelmGain: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    divertHelmLoss: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    divertScienceGain: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    divertScienceLoss: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    divertTacticalGain: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    divertTacticalLoss: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    /** Power banked on a system, which stays until a card spends it all (see the Discharge and Surge Draw cards). It does nothing itself, and has no time limit. */
    charge: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: chargeMaxLevel,
    },
    /** Plasma flux, which builds up on a system that's run past its limit. On reaching its max level, one of the system's cards is damaged and the Flux is removed. It has no time limit. */
    flux: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        maxLevel: fluxLimit,
    },
    /** This system runs lower for a while, and gains Charge when that ends (see the Bank Power card). */
    bankingPower: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
        duration: bankPowerDuration,
    },
    /** This system runs higher for a while, by its level, which is the Charge that was spent on it (see the Discharge card). */
    discharging: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: chargeMaxLevel,
        duration: dischargeDuration,
    },
    /** This system runs higher, and gains Flux on each tick, until it's stopped (see the Redline card). It has no time limit. */
    redlining: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        tickInterval: redlineFluxInterval,
    },
    /** On a ship's hull: it's unpowered, so its shields absorb nothing (see the Vent card). */
    shieldsVented: {
        category: SystemEffectCategory.Negative,
        usesLevels: false,
        duration: ventShieldsDownDuration,
    },
    /** This system runs higher for a while (see the Rail Feed card). */
    railFeed: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: railFeedDuration,
    },
    /** This system runs higher for a while, by twice its level, which is the Flux that was spent on it. When that ends, it resets (see the Burnout card). */
    burningOut: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: fluxLimit - 1,
        duration: burnoutDuration,
    },
    /** This system runs higher for a while, by its level, which is how far it was below its neighbour (see the Bus Link card). */
    busLinked: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: MAX_POWER_LEVEL,
        duration: busLinkDuration,
    },
    /** The next hit that would damage one of this system's cards spends one of its Charge instead, and removes this (see the Buffer card). It has no time limit. */
    buffered: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
    },
    /** On the engineer's system: an Auto-destruct is waiting for the rest of the crew to confirm it. Its level is how many more confirmations it needs, and it lapses if they don't come in time. */
    autoDestructRequested: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        maxLevel: autoDestructConfirmationsNeeded,
        duration: autoDestructConfirmWindow,
    },
    /** On the engineer's system: the ship explodes when this runs out, unless the Abort Auto-destruct card is played first (see the Auto-destruct card). */
    autoDestructing: {
        category: SystemEffectCategory.Negative,
        usesLevels: false,
        duration: autoDestructDuration,
    },
    /** Every card of this system was damaged, for parts. Its level is how many, which is how many the Graft card can repair elsewhere (see the Cannibalise card). It has no time limit. */
    cannibalised: {
        category: SystemEffectCategory.Neutral,
        usesLevels: true,
    },
    /** This system runs higher for a while, and gains Flux when that ends (see the Emergency Power card). */
    emergencyPower: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: emergencyPowerDuration,
    },
});
