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
} as const);

export type SystemEffectType = keyof typeof systemEffectDefinitions;

export type LeveledSystemEffectType = {
    [K in SystemEffectType]: typeof systemEffectDefinitions[K]['usesLevels'] extends true ? K : never
}[SystemEffectType];
