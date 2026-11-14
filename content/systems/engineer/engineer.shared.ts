import { defineCards, defineEffects, defineSharedContent } from 'common-data/content/SharedContent';
import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';
import { extendedShieldsDuration, extendedShieldsRange } from 'common-data/features/ships/utils/extendedShields';
import { MAX_POWER_LEVEL } from 'common-data/features/ships/utils/powerLevel';

/** How long a friendly ship is powered from another, once the Transfer Power card is played. */
export const transferPowerDuration = 20_000;

/** How close a friendly ship has to be for Transfer Power to reach it, in world units. */
export const transferPowerRange = 6;

/** How much lower a system runs while it's running quiet (see the Run Quiet card). */
export const runQuietPowerLoss = 2;

const effects = defineEffects({
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
    /** This system runs lower until it's brought back (see the Run Quiet card). It has no time limit. */
    runningQuiet: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
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
});

const cards = defineCards({
    smokeScreen: {
        targetType: 'no-target',
        system: 'engineer',
        parameters: { cost: 3 },
    },
    auxPower: {
        targetType: 'system',
        system: 'engineer',
        traits: ['expendable'],
        parameters: { cost: 1, powerGain: 1 },
    },
    swapSystems: {
        targetType: 'choice',
        system: 'engineer',
        cards: ['swapHorizontal', 'swapUp', 'swapDown'],
        parameters: { cost: 3 },
    },
    swapHorizontal: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3 },
    },
    swapUp: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3 },
    },
    swapDown: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3 },
    },
    purge: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3 },
    },
    reset: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 4, duration: 3 },
    },
    focusShields: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 1, shieldBoost: 50, shieldReduction: 10 },
    },
    extendShields: {
        targetType: 'no-target',
        system: 'engineer',
        parameters: { cost: 3, duration: extendedShieldsDuration / 1000, range: extendedShieldsRange },
    },
    transferPower: {
        targetType: 'no-target',
        system: 'engineer',
        parameters: { cost: 4, duration: transferPowerDuration / 1000, range: transferPowerRange },
    },
    runQuiet: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 1, powerChange: runQuietPowerLoss },
    },
    relocateSystem: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 5 },
    },
    relocateHere: {
        targetType: 'system',
        system: 'engineer',
        traits: ['expendable'],
        parameters: { cost: 1 },
    },
    sustain: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 2 },
    },
    distributePower: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3, powerChange: 1, duration: 30 },
    },
    drawPower: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3, powerChange: 1, duration: 30 },
    },
    divertAllPower: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 4, lossPerSystem: 1, duration: 20, targetGain: 5 },
    },
    divertSystemPower: {
        targetType: 'choice',
        system: 'engineer',
        cards: ['divertHelm', 'divertScience', 'divertTactical'],
        parameters: { cost: 3 },
    },
    divertHelm: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3, maxAmount: 3, duration: 20 },
    },
    divertScience: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3, maxAmount: 3, duration: 20 },
    },
    divertTactical: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3, maxAmount: 3, duration: 20 },
    },
    overcharge: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 2, powerGain: 3, duration: 15 },
    },
    shunt: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3 },
    },
    drawPriority: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 2 },
    },
});

export const engineerShared = defineSharedContent({ cards, effects });
