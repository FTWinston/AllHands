import { SystemEffectDefinition } from '../types/SystemEffectDefinition';

// Enforce that values are of a system effect type, without widening the key type to "string".
function defineSystemEffects<T extends Record<string, SystemEffectDefinition>>(defs: T) {
    return defs;
}

export const systemEffectDefinitions = defineSystemEffects({
    auxPower: {
        positive: true,
    },
    something1: {
        positive: true,
        duration: 3000,
    },
    something2: {
        positive: false,
        duration: 5000,
    },
    something3: {
        positive: false,
    },
    something4: {
        positive: false,
        duration: 10000,
    },
    something5: {
        positive: true,
        duration: 4000,
    },
    something6: {
        positive: true,
        duration: 2000,
    },
    something7: {
        positive: true,
        duration: 4000,
    },
    something8: {
        positive: true,
        duration: 2000,
    },
} as const);

export type SystemEffectType = keyof typeof systemEffectDefinitions;
