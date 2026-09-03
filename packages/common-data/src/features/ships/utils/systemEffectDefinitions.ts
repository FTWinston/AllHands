import { SystemEffectDefinition, SystemEffectCategory } from '../types/SystemEffectDefinition';

export const MAX_POWER_LEVEL = 5;

// Enforce that values are of a system effect type, without widening the key type to "string".
function defineSystemEffects<T extends Record<string, SystemEffectDefinition>>(defs: T) {
    return defs;
}

export const systemEffectDefinitions = defineSystemEffects({
    shield: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: 100,
    },
    auxPower: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: 30_000,
    },
    reducedPower: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        maxLevel: MAX_POWER_LEVEL,
    },
    feedback: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        duration: 20_000,
    },
    disruptGeneration: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
    },
    shieldFocus: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: 20_000,
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
    reactorBreach: {
        category: SystemEffectCategory.Negative,
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
    generationPriority: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: 60_000,
    },
    antiprotonResidue: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        duration: 12_000,
    },
    tetryonAccumulation: {
        category: SystemEffectCategory.Negative,
        usesLevels: false,
        duration: 8_000,
    },
    chronitonSaturation: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        duration: 20_000,
    },
    polaronBombardment: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        duration: 10_000,
    },
    polaronAccumulation: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: 10_000,
    },
    tetryonSaturation: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        duration: 8_000,
    },
    reducedCardCost: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
    },
} as const);

export type SystemEffectType = keyof typeof systemEffectDefinitions;

export type LeveledSystemEffectType = {
    [K in SystemEffectType]: typeof systemEffectDefinitions[K]['usesLevels'] extends true ? K : never
}[SystemEffectType];
