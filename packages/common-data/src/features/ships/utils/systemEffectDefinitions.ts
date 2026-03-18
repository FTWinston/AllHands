import { SystemEffectDefinition } from '../types/SystemEffectDefinition';

export const MAX_POWER_LEVEL = 5;

// Enforce that values are of a system effect type, without widening the key type to "string".
function defineSystemEffects<T extends Record<string, SystemEffectDefinition>>(defs: T) {
    return defs;
}

export const systemEffectDefinitions = defineSystemEffects({
    shield: {
        positive: true,
        usesLevels: true,
        maxLevel: 100,
    },
    auxPower: {
        positive: true,
        usesLevels: false,
        duration: 30_000,
    },
    reducedPower: {
        positive: false,
        usesLevels: true,
        maxLevel: MAX_POWER_LEVEL,
    },
    feedback: {
        positive: false,
        usesLevels: true,
        duration: 20_000,
    },
    disruptGeneration: {
        positive: false,
        usesLevels: true,
    },
    shieldFocus: {
        positive: true,
        usesLevels: false,
        duration: 20_000,
    },
    shieldReduced: {
        positive: false,
        usesLevels: false,
        duration: 20_000,
    },
    resetting: {
        positive: true,
        usesLevels: false,
        duration: 3_000,
    },
    reactorBreach: {
        positive: false,
        usesLevels: false,
        duration: 3_000,
    },
    relocating: {
        positive: true,
        usesLevels: false,
    },
    overcharge: {
        positive: true,
        usesLevels: false,
        duration: 15_000,
        tickInterval: 1_000,
    },
    distributePowerLoss: {
        positive: false,
        usesLevels: true,
        maxLevel: 3,
        duration: 30_000,
    },
    distributePowerGain: {
        positive: true,
        usesLevels: true,
        maxLevel: 3,
        duration: 30_000,
    },
    drawPowerGain: {
        positive: true,
        usesLevels: true,
        maxLevel: 3,
        duration: 30_000,
    },
    drawPowerLoss: {
        positive: false,
        usesLevels: true,
        maxLevel: 3,
        duration: 30_000,
    },
    divertAllPowerGain: {
        positive: true,
        usesLevels: true,
        maxLevel: MAX_POWER_LEVEL,
        duration: 20_000,
    },
    divertAllPowerLoss: {
        positive: false,
        usesLevels: true,
        maxLevel: 1,
        duration: 20_000,
    },
    divertHelmGain: {
        positive: true,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    divertHelmLoss: {
        positive: false,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    divertSensorsGain: {
        positive: true,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    divertSensorsLoss: {
        positive: false,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    divertTacticalGain: {
        positive: true,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    divertTacticalLoss: {
        positive: false,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    generationPriority: {
        positive: true,
        usesLevels: false,
        duration: 60_000,
    },
} as const);

export type SystemEffectType = keyof typeof systemEffectDefinitions;

export type LeveledSystemEffectType = {
    [K in SystemEffectType]: typeof systemEffectDefinitions[K]['usesLevels'] extends true ? K : never
}[SystemEffectType];
