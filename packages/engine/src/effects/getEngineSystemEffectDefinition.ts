import { LeveledSystemEffectType, systemEffectDefinitions, SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { EngineerSystemTile } from 'src/state/EngineerSystemTile';
import { EngineSystemEffectDefinition, SystemEffectFunctionality } from './EngineSystemEffectDefinition';

type SystemEffectFunctionalityLookup = Record<SystemEffectType, SystemEffectFunctionality>;

/**
 * Create a "hub" power transfer effect. The hub is on the card's target system.
 * When removed, it force-removes the paired "spoke" effects from all other systems.
 * @param spokeType The effect type placed on the other systems.
 * @param powerDirection +1 if this effect increases power (gain), -1 if it decreases (loss).
 */
function createTransferHubEffect(spokeType: SystemEffectType, powerDirection: 1 | -1): SystemEffectFunctionality {
    return {
        apply: (system, level) => {
            system.adjustSystemPowerLevel(powerDirection * level);
            return true;
        },
        remove: (system, early, level) => {
            system.adjustSystemPowerLevel(-powerDirection * level);
            for (const s of system.systemState.getShip().engineerState.systems) {
                if (s !== system) {
                    s.removeEffect(spokeType, early);
                }
            }
        },
        onLevelChanged: (system, newLevel, oldLevel) => {
            system.adjustSystemPowerLevel(powerDirection * (newLevel - oldLevel));
        },
    };
}

/**
 * Create a "spoke" power transfer effect. Spokes are on the systems affected by a redistribution.
 * When removed, it reduces the paired "hub" effect's level on whichever system has it.
 * @param hubType The effect type placed on the card's target system.
 * @param powerDirection +1 if this effect increases power (gain), -1 if it decreases (loss).
 */
function createTransferSpokeEffect(hubType: LeveledSystemEffectType, powerDirection: 1 | -1): SystemEffectFunctionality {
    return {
        apply: (system, level) => {
            system.adjustSystemPowerLevel(powerDirection * level);
            return true;
        },
        remove: (system, _early, level) => {
            system.adjustSystemPowerLevel(-powerDirection * level);
            for (const s of system.systemState.getShip().engineerState.systems) {
                if (s.hasEffect(hubType)) {
                    s.adjustEffectLevel(hubType, -level);
                    break;
                }
            }
        },
        onLevelChanged: (system, newLevel, oldLevel) => {
            system.adjustSystemPowerLevel(powerDirection * (newLevel - oldLevel));
        },
    };
}

/**
 * Create a 1:1 paired power transfer effect. Used for Divert Helm/Sensors/Tactical,
 * where there is exactly one source (loss) and one target (gain).
 * When removed, the paired effect is fully removed from whichever system has it.
 * @param pairedType The paired effect type.
 * @param powerDirection +1 if this effect increases power (gain), -1 if it decreases (loss).
 */
function createOneToOneTransferEffect(pairedType: SystemEffectType, powerDirection: 1 | -1): SystemEffectFunctionality {
    return {
        apply: (system, level) => {
            system.adjustSystemPowerLevel(powerDirection * level);
            return true;
        },
        remove: (system, early, level) => {
            system.adjustSystemPowerLevel(-powerDirection * level);
            for (const s of system.systemState.getShip().engineerState.systems) {
                s.removeEffect(pairedType, early);
            }
        },
        onLevelChanged: (system, newLevel, oldLevel) => {
            system.adjustSystemPowerLevel(powerDirection * (newLevel - oldLevel));
        },
    };
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

                system.removeEffect('shieldReduced', false);
                system.shieldPassThroughModifier -= 50;
                return true;
            },
            remove: (system, early) => {
                system.shieldPassThroughModifier += 50;
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

                system.removeEffect('shieldFocus', false);
                system.shieldPassThroughModifier += 10;
                return true;
            },
            remove: (system, early) => {
                system.shieldPassThroughModifier -= 10;
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
        relocating: {
            apply: () => {
                return true;
            },
            remove: () => {
            },
        },
        overcharge: {
            apply: (system) => {
                system.adjustSystemPowerLevel(3);
                return true;
            },
            remove: (system) => {
                system.adjustSystemPowerLevel(-3);
            },
            tick: (system) => {
                system.adjustSystemHealth(-1);
            },
        },

        // Distribute Power: target loses power (hub), neighbors gain power (spokes).
        distributePowerLoss: createTransferHubEffect('distributePowerGain', -1),
        distributePowerGain: createTransferSpokeEffect('distributePowerLoss', 1),

        // Draw Power: target gains power (hub), neighbors lose power (spokes).
        drawPowerGain: createTransferHubEffect('drawPowerLoss', 1),
        drawPowerLoss: createTransferSpokeEffect('drawPowerGain', -1),

        // Divert All Power: target gains power (hub), all others lose power (spokes).
        divertAllPowerGain: createTransferHubEffect('divertAllPowerLoss', 1),
        divertAllPowerLoss: createTransferSpokeEffect('divertAllPowerGain', -1),

        // Divert Helm/Sensors/Tactical: 1:1 pairs between source and target.
        divertHelmGain: createOneToOneTransferEffect('divertHelmLoss', 1),
        divertHelmLoss: createOneToOneTransferEffect('divertHelmGain', -1),
        divertSensorsGain: createOneToOneTransferEffect('divertSensorsLoss', 1),
        divertSensorsLoss: createOneToOneTransferEffect('divertSensorsGain', -1),
        divertTacticalGain: createOneToOneTransferEffect('divertTacticalLoss', 1),
        divertTacticalLoss: createOneToOneTransferEffect('divertTacticalGain', -1),
        generationPriority: {
            apply: (system) => {
                // Remove this effect from every other ship system.
                for (const s of system.systemState.getShip().engineerState.systems) {
                    if (s !== system) {
                        s.removeEffect('generationPriority', true);
                    }
                }
                return true;
            },
            remove: () => {
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
