import { systemEffectDefinitions, SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { EngineSystemEffectDefinition, SystemEffectFunctionality } from './EngineSystemEffectDefinition';

type SystemEffectFunctionalityLookup = Record<SystemEffectType, SystemEffectFunctionality>;

function loadSystemEffectDefinitions() {
    const systemEffectFunctionalities: SystemEffectFunctionalityLookup = {
        auxPower: {
            apply: (system) => {
                // Remove this effect from every other ship system.
                system.systemState.getShip().engineerState.systems.forEach((s) => {
                    if (s.system !== system.system) {
                        s.removeEffect('auxPower', true);
                    }
                });

                system.adjustSystemPowerLevel(1);
                return true;
            },
            remove: (system, _early) => {
                system.adjustSystemPowerLevel(-1);
            },
        },
        something1: {
            apply: (_system) => {
                return true;
            },
            remove: (_system, _early) => {

            },
        },
        something2: {
            apply: (_system) => {
                return true;
            },
            remove: (_system, _early) => {

            },
        },
        something3: {
            apply: (_system) => {
                return true;
            },
            remove: (_system, _early) => {

            },
        },
        something4: {
            apply: (_system) => {
                return true;
            },
            remove: (_system, _early) => {

            },
        },
        something5: {
            apply: (_system) => {
                return true;
            },
            remove: (_system, _early) => {

            },
        },
        something6: {
            apply: (_system) => {
                return true;
            },
            remove: (_system, _early) => {

            },
        },
        something7: {
            apply: (_system) => {
                return true;
            },
            remove: (_system, _early) => {

            },
        },
        something8: {
            apply: (_system) => {
                return true;
            },
            remove: (_system, _early) => {

            },
        },
    };

    const engineSystemEffectDefinitions = Object.entries(systemEffectDefinitions)
        .reduce((acc, [type, def]) => {
            const functionality = (systemEffectFunctionalities as Record<SystemEffectType, SystemEffectFunctionality>)[type as SystemEffectType];
            acc[type as SystemEffectType] = { ...def, ...functionality } as EngineSystemEffectDefinition;
            return acc;
        }, {} as Record<SystemEffectType, EngineSystemEffectDefinition>);
    return engineSystemEffectDefinitions;
}

const engineSystemEffectDefinitions = loadSystemEffectDefinitions();

export const getSystemEffectDefinition = (type: SystemEffectType): EngineSystemEffectDefinition => {
    const effectDef = engineSystemEffectDefinitions[type];

    if (!effectDef) {
        throw new Error(`Effect definition not found: ${type}`);
    }

    return effectDef;
};
