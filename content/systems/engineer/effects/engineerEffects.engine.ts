import { LeveledSystemEffectType, SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { runQuietPowerLoss } from 'content/systems/engineer/engineer.shared';
import { defineEngineEffects } from 'engine/content/EngineContent';
import { SystemEffectFunctionality } from 'engine/effects/EngineSystemEffectDefinition';
import { effects as sharedEffects } from './engineerEffects.shared';

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
        remove: (system, removal, level) => {
            system.adjustSystemPowerLevel(-powerDirection * level);
            for (const s of system.systemState.getShip().engineerState.systems) {
                if (s !== system) {
                    s.removeEffect(spokeType, removal);
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
        remove: (system, _removal, level) => {
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
 * Create a 1:1 paired power transfer effect. Used for Divert Helm/Science/Tactical,
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
        remove: (system, removal, level) => {
            system.adjustSystemPowerLevel(-powerDirection * level);
            for (const s of system.systemState.getShip().engineerState.systems) {
                s.removeEffect(pairedType, removal);
            }
        },
        onLevelChanged: (system, newLevel, oldLevel) => {
            system.adjustSystemPowerLevel(powerDirection * (newLevel - oldLevel));
        },
    };
}

export const effects = defineEngineEffects(sharedEffects, {
    auxPower: {
        apply: (system, _level) => {
            // Remove this effect from every other ship system.
            system.systemState.getShip().engineerState.systems.forEach((s) => {
                if (s.system !== system.system) {
                    s.removeEffect('auxPower', 'early');
                }
            });

            system.adjustSystemPowerLevel(1);
            return true;
        },
        remove: (system, _removal, _level) => {
            system.adjustSystemPowerLevel(-1);
        },
    },
    shieldFocus: {
        apply: (system) => {
            if (system.system === 'hull') {
                return false;
            }

            system.removeEffect('shieldReduced', 'expired');
            system.shieldPassThroughModifier -= 50;
            return true;
        },
        remove: (system, removal) => {
            system.shieldPassThroughModifier += 50;
            if (removal === 'early') {
                for (const s of system.systemState.getShip().engineerState.systems) {
                    s.removeEffect('shieldReduced', 'expired');
                }
            }
        },
    },
    // Nothing to do here: `Ship.damage` looks for this on any friendly ship nearby when one is hit.
    shieldsExtended: {
        apply: system => system.system === 'hull',
        remove: () => {},
    },
    // Nothing to do here: an encounter that cares whether a ship is being powered looks for this on its hull.
    powerReceived: {
        apply: system => system.system === 'hull',
        remove: () => {},
    },
    runningQuiet: {
        apply: (system) => {
            system.adjustSystemPowerLevel(-runQuietPowerLoss);
            return true;
        },
        remove: (system) => {
            system.adjustSystemPowerLevel(runQuietPowerLoss);
        },
    },
    shieldReduced: {
        apply: (system) => {
            if (system.system === 'hull') {
                return false;
            }

            system.removeEffect('shieldFocus', 'expired');
            system.shieldPassThroughModifier += 10;
            return true;
        },
        remove: (system, removal) => {
            system.shieldPassThroughModifier -= 10;
            if (removal === 'early') {
                for (const s of system.systemState.getShip().engineerState.systems) {
                    s.removeEffect('shieldFocus', 'expired');
                }
            }
        },
    },
    resetting: {
        apply: (system) => {
            system.adjustSystemPowerLevel(-100);
            return true;
        },
        remove: (system, removal) => {
            system.adjustSystemPowerLevel(100);

            // When everything is being cleared away, the other effects are going anyway, without moving anywhere as they would if the reset removed them.
            if (removal !== 'cleared') {
                system.removeAllEffects();
            }
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
    // Divert Helm/Science/Tactical: 1:1 pairs between source and target.
    divertHelmGain: createOneToOneTransferEffect('divertHelmLoss', 1),
    divertHelmLoss: createOneToOneTransferEffect('divertHelmGain', -1),
    divertScienceGain: createOneToOneTransferEffect('divertScienceLoss', 1),
    divertScienceLoss: createOneToOneTransferEffect('divertScienceGain', -1),
    divertTacticalGain: createOneToOneTransferEffect('divertTacticalLoss', 1),
    divertTacticalLoss: createOneToOneTransferEffect('divertTacticalGain', -1),
});
