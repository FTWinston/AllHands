import { systemEffectDefinitions, SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { EngineSystemEffectDefinition, SystemEffectFunctionality } from './EngineSystemEffectDefinition';

type SystemEffectFunctionalityLookup = Record<SystemEffectType, SystemEffectFunctionality>;

function loadSystemEffectDefinitions() {
    const systemEffectFunctionalities: SystemEffectFunctionalityLookup = {
        shield: {
            apply: (system) => {
                return system.system === 'hull';
            },
            remove: () => {

            },
        },
        auxPower: {
            apply: (system, _level) => {
                // Remove this effect from every other ship system.
                system.systemState.getShip().engineerState.systems.forEach((s) => {
                    if (s.system !== system.system) {
                        s.removeEffect('auxPower', true);
                    }
                });

                system.adjustSystemPowerLevel(1);
                return true;
            },
            remove: (system, _early, _level) => {
                system.adjustSystemPowerLevel(-1);
            },
        },
        reducedPower: {
            apply: (system, level) => {
                system.adjustSystemPowerLevel(-level);
                return true;
            },
            remove: (system, early, level) => {
                system.adjustSystemPowerLevel(level);

                if (early) {
                    // If removed early, add this effect to a different system instead.
                    const ship = system.systemState.getShip();
                    const anotherSystem = ship.random.pick(ship.engineerState.systems.filter(s => s.system !== system.system));
                    anotherSystem.addEffect('reducedPower', level);
                }
            },
            onLevelChanged: (system, newLevel, oldLevel) => {
                system.adjustSystemPowerLevel(oldLevel - newLevel);
            },
        },
        disruptGeneration: {
            apply: (system) => {
                // Stop generation events from firing while this effect is active.
                // The level of this effect should be reduced by 1 each time a generation event would have fired.
                system.systemState.generate.addListener('disruptGeneration', true, () => {
                    system.adjustEffectLevel('disruptGeneration', -1);
                });
                return true;
            },
            remove: (system) => {
                // When removed, allow generation events to fire again.
                system.systemState.generate.removeListener('disruptGeneration');
            },
        },
        feedback: {
            apply: (system, level) => {
                // Take level of damage every time this system generates.
                system.systemState.generate.addListener('feedback', false, () => {
                    system.adjustSystemHealth(-level);
                });
                return true;
            },
            remove: (system) => {
                // When removed, allow generation events to fire again.
                system.systemState.generate.removeListener('feedback');
            },
            onLevelChanged: (system, newLevel) => {
                // addListener replaces the old listener, so we can just call it again with the new level.
                system.systemState.generate.addListener('feedback', false, () => {
                    system.adjustSystemHealth(-newLevel);
                });
            },
        },
        shieldFocus: {
            apply: (system) => {
                if (system.system === 'hull') {
                    return false;
                }

                // TODO: this
                system.removeEffect('shieldReduced', false);
                return true;
            },
            remove: (system, early) => {
                if (early) {
                    for (const s of system.systemState.getShip().engineerState.systems) {
                        s.removeEffect('shieldReduced', false);
                    }
                }
            },
        },
        shieldReduced: {
            apply: (system) => {
                if (system.system === 'hull') {
                    return false;
                }

                // TODO: this
                system.removeEffect('shieldFocus', false);
                return true;
            },
            remove: (system, early) => {
                if (early) {
                    for (const s of system.systemState.getShip().engineerState.systems) {
                        s.removeEffect('shieldFocus', false);
                    }
                }
            },
        },
        resetting: {
            apply: (system) => {
                system.adjustSystemPowerLevel(-100);
                return true;
            },
            remove: (system) => {
                system.adjustSystemPowerLevel(100);
                system.removeAllEffects();
            },
        },
        reactorBreach: {
            apply: () => {
                return true;
            },
            remove: (system) => {
                system.systemState.getShip().destroy();
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
