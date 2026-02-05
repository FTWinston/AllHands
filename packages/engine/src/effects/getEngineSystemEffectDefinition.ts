import { systemEffectDefinitions, SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { EngineSystemEffectDefinition, SystemEffectFunctionality } from './EngineSystemEffectDefinition';

type SystemEffectFunctionalityLookup = Record<SystemEffectType, SystemEffectFunctionality>;

function loadSystemEffectDefinitions() {
    const systemEffectFunctionalities: SystemEffectFunctionalityLookup = {
        something1: {
            apply: (_gameState, _ship) => {
                return true;
            },
            remove: (_gameState, _ship, _early) => {

            },
        },
        something2: {
            apply: (_gameState, _ship) => {
                return true;
            },
            remove: (_gameState, _ship, _early) => {

            },
        },
        something3: {
            apply: (_gameState, _ship) => {
                return true;
            },
            remove: (_gameState, _ship, _early) => {

            },
        },
        something4: {
            apply: (_gameState, _ship) => {
                return true;
            },
            remove: (_gameState, _ship, _early) => {

            },
        },
        something5: {
            apply: (_gameState, _ship) => {
                return true;
            },
            remove: (_gameState, _ship, _early) => {

            },
        },
        something6: {
            apply: (_gameState, _ship) => {
                return true;
            },
            remove: (_gameState, _ship, _early) => {

            },
        },
        something7: {
            apply: (_gameState, _ship) => {
                return true;
            },
            remove: (_gameState, _ship, _early) => {

            },
        },
        something8: {
            apply: (_gameState, _ship) => {
                return true;
            },
            remove: (_gameState, _ship, _early) => {

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
