import { SystemEffectDefinition } from '../types/SystemEffectDefinition';

// Enforce that values are of a system effect type, without widening the key type to "string".
function defineSystemEffects<T extends Record<string, SystemEffectDefinition>>(defs: T) {
    return defs;
}

export const systemEffectDefinitions = defineSystemEffects({
    auxPower: {
        enabled: true,
        positive: true,
    },
    reducedPower: {
        enabled: true,
        positive: false,
        usesLevels: true,
    },
    something1: {
        enabled: true,
        positive: true,
        duration: 3000,
    },
    something2: {
        enabled: true,
        positive: false,
        duration: 5000,
    },
    something3: {
        enabled: true,
        positive: false,
    },
    something4: {
        enabled: true,
        positive: false,
        duration: 10000,
    },
    something5: {
        enabled: true,
        positive: true,
        duration: 4000,
    },
    something6: {
        enabled: true,
        positive: true,
        duration: 2000,
    },
    something7: {
        enabled: true,
        positive: true,
        duration: 4000,
    },
    something8: {
        enabled: true,
        positive: true,
        duration: 2000,
    },
} as const);

export type SystemEffectType = keyof typeof systemEffectDefinitions;
