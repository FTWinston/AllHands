import type { SystemEffectDescription, UISystemEffectDefinition } from '../types/UISystemEffectDefinition';
import type { SystemEffectDefinition } from 'common-data/features/ships/types/SystemEffectDefinition';
import type { SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';

/** Every registered status effect, with how it's described. Filled by `registerUiContent`. */
const uiEffectDefinitions = new Map<string, UISystemEffectDefinition>();

/** Register the given status effects, with how each one is described. */
export function registerEffectDescriptions(effects: Readonly<Record<string, SystemEffectDefinition>>, descriptions: Readonly<Record<string, SystemEffectDescription>>) {
    for (const [type, definition] of Object.entries(effects)) {
        if (uiEffectDefinitions.has(type)) {
            throw new Error(`Status effect registered twice: ${type}`);
        }
        uiEffectDefinitions.set(type, { ...definition, ...descriptions[type] });
    }
}

export const getSystemEffectDefinition = (type: SystemEffectType): UISystemEffectDefinition => {
    const effectDef = uiEffectDefinitions.get(type);

    if (!effectDef) {
        throw new Error(`System effect definition not found: ${type}`);
    }

    return effectDef;
};
