import { SystemEffectDefinition, SystemEffectPolarity } from '../types/SystemEffectDefinition';

export const MAX_POWER_LEVEL = 5;

// Enforce that values are of a system effect type, without widening the key type to "string".
function defineSystemEffects<T extends Record<string, SystemEffectDefinition>>(defs: T) {
    return defs;
}

export const systemEffectDefinitions = defineSystemEffects({
    shield: {
        polarity: SystemEffectPolarity.Positive,
        usesLevels: true,
        maxLevel: 100,
    },
    auxPower: {
        polarity: SystemEffectPolarity.Positive,
        usesLevels: false,
        duration: 30_000,
    },
    reducedPower: {
        polarity: SystemEffectPolarity.Negative,
        usesLevels: true,
        maxLevel: MAX_POWER_LEVEL,
    },
    feedback: {
        polarity: SystemEffectPolarity.Negative,
        usesLevels: true,
        duration: 20_000,
    },
    disruptGeneration: {
        polarity: SystemEffectPolarity.Negative,
        usesLevels: true,
    },
    shieldFocus: {
        polarity: SystemEffectPolarity.Positive,
        usesLevels: false,
        duration: 20_000,
    },
    shieldReduced: {
        polarity: SystemEffectPolarity.Negative,
        usesLevels: false,
        duration: 20_000,
    },
    resetting: {
        polarity: SystemEffectPolarity.Positive,
        usesLevels: false,
        duration: 3_000,
    },
    reactorBreach: {
        polarity: SystemEffectPolarity.Negative,
        usesLevels: false,
        duration: 3_000,
    },
    relocating: {
        polarity: SystemEffectPolarity.Positive,
        usesLevels: false,
    },
    overcharge: {
        polarity: SystemEffectPolarity.Positive,
        usesLevels: false,
        duration: 15_000,
        tickInterval: 1_000,
    },
    distributePowerLoss: {
        polarity: SystemEffectPolarity.Negative,
        usesLevels: true,
        maxLevel: 3,
        duration: 30_000,
    },
    distributePowerGain: {
        polarity: SystemEffectPolarity.Positive,
        usesLevels: true,
        maxLevel: 3,
        duration: 30_000,
    },
    drawPowerGain: {
        polarity: SystemEffectPolarity.Positive,
        usesLevels: true,
        maxLevel: 3,
        duration: 30_000,
    },
    drawPowerLoss: {
        polarity: SystemEffectPolarity.Negative,
        usesLevels: true,
        maxLevel: 3,
        duration: 30_000,
    },
    divertAllPowerGain: {
        polarity: SystemEffectPolarity.Positive,
        usesLevels: true,
        maxLevel: MAX_POWER_LEVEL,
        duration: 20_000,
    },
    divertAllPowerLoss: {
        polarity: SystemEffectPolarity.Negative,
        usesLevels: true,
        maxLevel: 1,
        duration: 20_000,
    },
    divertHelmGain: {
        polarity: SystemEffectPolarity.Positive,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    divertHelmLoss: {
        polarity: SystemEffectPolarity.Negative,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    divertScienceGain: {
        polarity: SystemEffectPolarity.Positive,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    divertScienceLoss: {
        polarity: SystemEffectPolarity.Negative,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    divertTacticalGain: {
        polarity: SystemEffectPolarity.Positive,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    divertTacticalLoss: {
        polarity: SystemEffectPolarity.Negative,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    generationPriority: {
        polarity: SystemEffectPolarity.Positive,
        usesLevels: false,
        duration: 60_000,
    },
    beingScanned: {
        polarity: SystemEffectPolarity.Neutral,
        usesLevels: true,
        maxLevel: 255,
    },
} as const);

export type SystemEffectType = keyof typeof systemEffectDefinitions;

export type LeveledSystemEffectType = {
    [K in SystemEffectType]: typeof systemEffectDefinitions[K]['usesLevels'] extends true ? K : never
}[SystemEffectType];
