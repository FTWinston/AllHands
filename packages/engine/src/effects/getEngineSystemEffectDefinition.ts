import type { EngineSystemEffectDefinition, SystemEffectFunctionality } from './EngineSystemEffectDefinition';
import type { SystemEffectDefinition } from 'common-data/features/ships/types/SystemEffectDefinition';
import type { SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import type { EngineerSystemTile } from 'src/state/systems/engineer/EngineerSystemTile';

/** Every registered status effect, with what it does. Filled by `registerEngineContent`. */
const engineSystemEffectDefinitions = new Map<string, EngineSystemEffectDefinition>();

/** Register the given status effects, with what each one does. */
export function registerEffects(effects: Readonly<Record<string, SystemEffectDefinition>>, functionality: Readonly<Record<string, SystemEffectFunctionality>>) {
    for (const [type, definition] of Object.entries(effects)) {
        if (engineSystemEffectDefinitions.has(type)) {
            throw new Error(`Status effect registered twice: ${type}`);
        }
        engineSystemEffectDefinitions.set(type, { ...definition, ...functionality[type] });
    }
}

/**
 * Remove the given effect from the given system, without triggering the removal handler.
 * This is used by effects that consolidate levels on transfer (Shunt card).
 */
export function removeEffectWithoutHandler(system: EngineerSystemTile, effectType: SystemEffectType): boolean {
    const index = system.effects.findIndex(e => e.type === effectType);
    if (index === -1) {
        return false;
    }
    system.effects.splice(index, 1);
    return true;
}

export const getSystemEffectDefinition = (type: SystemEffectType): EngineSystemEffectDefinition => {
    const effectDef = engineSystemEffectDefinitions.get(type);

    if (!effectDef) {
        throw new Error(`Effect definition not found: ${type}`);
    }

    return effectDef;
};
