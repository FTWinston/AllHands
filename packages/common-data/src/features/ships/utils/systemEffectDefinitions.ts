import { SystemEffectDefinition } from '../types/SystemEffectDefinition';

export const MAX_POWER_LEVEL = 5;

// Enforce that values are of a system effect type, without widening the key type to "string".
function defineSystemEffects<T extends Record<string, SystemEffectDefinition>>(defs: T) {
    return defs;
}

export const systemEffectDefinitions = defineSystemEffects({
    auxPower: {
        positive: true,
        usesLevels: false,
    },
    reducedPower: {
        positive: false,
        usesLevels: true,
        maxLevel: MAX_POWER_LEVEL,
    },
    disruptGeneration: {
        positive: false,
        usesLevels: true,
    },
    something1: {
        positive: true,
        duration: 3000,
        usesLevels: false,
    },
    something2: {
        positive: false,
        duration: 5000,
        usesLevels: false,
    },
    something3: {
        positive: false,
        usesLevels: false,
    },
    something4: {
        positive: false,
        duration: 10000,
        usesLevels: false,
    },
    something5: {
        positive: true,
        duration: 4000,
        usesLevels: false,
    },
    something6: {
        positive: true,
        duration: 2000,
        usesLevels: false,
    },
    something7: {
        positive: true,
        duration: 4000,
        usesLevels: false,
    },
    something8: {
        positive: true,
        duration: 2000,
        usesLevels: false,
    },
} as const);

export type SystemEffectType = keyof typeof systemEffectDefinitions;

export type LeveledSystemEffectType = {
    [K in SystemEffectType]: typeof systemEffectDefinitions[K]['usesLevels'] extends true ? K : never
}[SystemEffectType];
