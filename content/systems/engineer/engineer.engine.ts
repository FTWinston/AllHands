import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';
import { LeveledSystemEffectType, SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { distributePowerEvaluator, powerBoostEvaluator } from 'engine/ai/evaluators/engineer';
import { getReactorCardTypeForSystem } from 'engine/cards/getReactorCardTypeForSystem';
import { defineEngineContent } from 'engine/content/EngineContent';
import { SystemEffectFunctionality } from 'engine/effects/EngineSystemEffectDefinition';
import { getSystemEffectDefinition } from 'engine/effects/getEngineSystemEffectDefinition';
import { CardState } from 'engine/state/CardState';
import { CooldownState } from 'engine/state/CooldownState';
import { EngineerSystemTile } from 'engine/state/systems/engineer/EngineerSystemTile';
import { transferPowerRange, runQuietPowerLoss, engineerShared } from './engineer.shared';

/**
 * Apply a set of saved effects onto a system, consolidating leveled effects where they already exist.
 * Used by the Shunt card to transfer effects between systems while preserving cooldowns.
 */
function applySwappedEffects(
    system: EngineerSystemTile,
    effects: Array<{ type: SystemEffectType; level: number; progress: CooldownState | null }>
) {
    for (const saved of effects) {
        if (system.hasEffect(saved.type)) {
            // Consolidate: increase level of existing effect.
            const def = getSystemEffectDefinition(saved.type);
            if (def.usesLevels) {
                system.adjustEffectLevel(saved.type as LeveledSystemEffectType, saved.level);
            }
            // Keep the longer-lasting cooldown.
            const existing = system.effects.find(e => e.type === saved.type);
            if (existing && saved.progress) {
                if (!existing.progress || saved.progress.endTime > existing.progress.endTime) {
                    existing.progress = saved.progress;
                }
            }
        } else {
            system.addEffect(saved.type, saved.level);
            // Override cooldown with preserved one.
            const added = system.effects.find(e => e.type === saved.type);
            if (added && saved.progress) {
                added.progress = saved.progress;
            }
        }
    }
}

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

export const engineerEngine = defineEngineContent({
    shared: engineerShared,
    cards: {
        smokeScreen: {
            play: (_ship) => {
                console.log('played smokeScreen'); return true;
            },
        },
        auxPower: {
            aiEvaluator: powerBoostEvaluator('auxPower', 30, 'auxPower'),
            play: (_gameState, _ship, system) => {
                return system.addEffect('auxPower');
            },
        },
        swapHorizontal: {
            play: (_gameState, ship, system) => {
                const systemIndex = ship.engineerState.systems.indexOf(system);
                const otherSystemIndex = systemIndex % 2 == 0 ? systemIndex + 1 : systemIndex - 1;
                const otherSystem = ship.engineerState.systems[otherSystemIndex];
                ship.engineerState.systems[systemIndex] = otherSystem;
                ship.engineerState.systems[otherSystemIndex] = system;
                return true;
            },
        },
        swapUp: {
            play: (_gameState, ship, system) => {
                const systemIndex = ship.engineerState.systems.indexOf(system);
                if (systemIndex < 2) {
                    return false;
                }

                const otherSystemIndex = systemIndex - 2;
                const otherSystem = ship.engineerState.systems[otherSystemIndex];
                ship.engineerState.systems[systemIndex] = otherSystem;
                ship.engineerState.systems[otherSystemIndex] = system;
                return true;
            },
        },
        swapDown: {
            play: (_gameState, ship, system) => {
                const systemIndex = ship.engineerState.systems.indexOf(system);
                if (systemIndex >= 4) {
                    return false;
                }

                const otherSystemIndex = systemIndex + 2;
                const otherSystem = ship.engineerState.systems[otherSystemIndex];
                ship.engineerState.systems[systemIndex] = otherSystem;
                ship.engineerState.systems[otherSystemIndex] = system;
                return true;
            },
        },
        purge: {
            play: (_gameState, _ship, system) => {
                const negativeEffect = system.effects.find(
                    e => getSystemEffectDefinition(e.type).category === SystemEffectCategory.Negative
                );

                if (!negativeEffect) {
                    return false;
                }

                system.removeEffect(negativeEffect.type, 'early');
                return true;
            },
        },
        reset: {
            play: (_gameState, _ship, system) => {
                system.addEffect('resetting');
                return true;
            },
        },
        extendShields: {
            play: (_gameState, ship) => {
                const hull = ship.engineerState.systems.find(tile => tile.system === 'hull');
                if (!hull) {
                    return false;
                }

                // Playing it again while it's running starts its time over, as adding an effect that's already there does.
                hull.addEffect('shieldsExtended');
                return true;
            },
        },
        transferPower: {
            play: (_gameState, ship) => {
                const hull = ship.nearestFriendlyShip(transferPowerRange)?.engineerState.systems.find(tile => tile.system === 'hull');
                if (!hull) {
                    return false;
                }

                // Playing it again while it's running starts its time over, as adding an effect that's already there does.
                hull.addEffect('powerReceived');
                return true;
            },
        },
        runQuiet: {
            play: (_gameState, _ship, system) => {
                // The same card brings it back.
                return system.hasEffect('runningQuiet')
                    ? system.removeEffect('runningQuiet', 'early')
                    : system.addEffect('runningQuiet');
            },
        },
        focusShields: {
            play: (_gameState, ship, system) => {
                if (system.system === 'hull') {
                    return false;
                }

                system.addEffect('shieldFocus');

                for (const otherSystem of ship.engineerState.systems) {
                    if (otherSystem !== system && otherSystem.system !== 'hull') {
                        otherSystem.addEffect('shieldReduced');
                    }
                }
                return true;
            },
        },
        relocateSystem: {
            play: (_gameState, ship, system) => {
                const alreadyRelocating = ship.engineerState.systems.some(s => s.effects.some(e => e.type === 'relocating'));
                if (alreadyRelocating) {
                    return false;
                }

                system.addEffect('relocating');
                ship.engineerState.addCard('relocateHere');
                return true;
            },
        },
        relocateHere: {
            play: (_gameState, ship, system) => {
                if (system.effects.some(e => e.type === 'relocating')) {
                    return false;
                }

                const relocatingSystem = ship.engineerState.systems.find(s => s.effects.some(e => e.type === 'relocating'));
                if (!relocatingSystem) {
                    return false;
                }

                const systemIndex = ship.engineerState.systems.indexOf(system);
                const relocatingIndex = ship.engineerState.systems.indexOf(relocatingSystem);
                ship.engineerState.systems[systemIndex] = relocatingSystem;
                ship.engineerState.systems[relocatingIndex] = system;
                relocatingSystem.removeEffect('relocating', 'early');
                return true;
            },
        },
        sustain: {
            play: (gameState, _ship, system) => {
                const currentTime = gameState.currentTime;
                let restarted = false;
                for (const effect of system.effects) {
                    if (effect.progress) {
                        const def = getSystemEffectDefinition(effect.type);
                        const duration = def.duration ?? (effect.progress.endTime - effect.progress.startTime);
                        effect.progress = new CooldownState(currentTime, currentTime + duration);
                        if (def.tickInterval) {
                            effect.lastTickTime = currentTime;
                        }
                        restarted = true;
                    }
                }
                return restarted;
            },
        },
        distributePower: {
            aiEvaluator: distributePowerEvaluator('distributePower'),
            play: (_gameState, ship, system, parameters) => {
                const systemIndex = ship.engineerState.systems.indexOf(system);
                const adjacent = ship.engineerState.getAdjacentSystems(systemIndex);
                const powerChange = parameters['powerChange'] ?? 1;
                system.addEffect('distributePowerLoss', powerChange * adjacent.length);

                // Increase each adjacent system's power by powerChange.
                for (const adj of adjacent) {
                    adj.addEffect('distributePowerGain', powerChange);
                }
                return true;
            },
        },
        drawPower: {
            aiEvaluator: powerBoostEvaluator('drawPower', 25),
            play: (_gameState, ship, system, parameters) => {
                const systemIndex = ship.engineerState.systems.indexOf(system);
                const adjacent = ship.engineerState.getAdjacentSystems(systemIndex);
                const powerChange = parameters['powerChange'] ?? 1;
                system.addEffect('drawPowerGain', powerChange * adjacent.length);

                // Decrease each adjacent system's power by powerChange.
                for (const adj of adjacent) {
                    adj.addEffect('drawPowerLoss', powerChange);
                }
                return true;
            },
        },
        divertAllPower: {
            play: (_gameState, ship, system, parameters) => {
                const lossPerSystem = parameters['lossPerSystem'] ?? 1;
                const targetGain = parameters['targetGain'] ?? 5;

                // All other systems lose power.
                for (const otherSystem of ship.engineerState.systems) {
                    if (otherSystem !== system) {
                        otherSystem.addEffect('divertAllPowerLoss', lossPerSystem);
                    }
                }

                // Target system gains power.
                system.addEffect('divertAllPowerGain', targetGain);
                return true;
            },
        },
        divertHelm: {
            play: (_gameState, ship, system, parameters) => {
                if (system.system === 'helm') {
                    return false;
                }
                const helmTile = ship.engineerState.systems.find(s => s.system === 'helm')!;
                const maxAmount = parameters['maxAmount'] ?? 3;
                const amount = Math.min(maxAmount, helmTile.power);
                if (amount <= 0) {
                    return false;
                }
                helmTile.addEffect('divertHelmLoss', amount);
                system.addEffect('divertHelmGain', amount);
                return true;
            },
        },
        divertScience: {
            play: (_gameState, ship, system, parameters) => {
                if (system.system === 'science') {
                    return false;
                }
                const scienceTile = ship.engineerState.systems.find(s => s.system === 'science')!;
                const maxAmount = parameters['maxAmount'] ?? 3;
                const amount = Math.min(maxAmount, scienceTile.power);
                if (amount <= 0) {
                    return false;
                }
                scienceTile.addEffect('divertScienceLoss', amount);
                system.addEffect('divertScienceGain', amount);
                return true;
            },
        },
        divertTactical: {
            play: (_gameState, ship, system, parameters) => {
                if (system.system === 'tactical') {
                    return false;
                }
                const tacticalTile = ship.engineerState.systems.find(s => s.system === 'tactical')!;
                const maxAmount = parameters['maxAmount'] ?? 3;
                const amount = Math.min(maxAmount, tacticalTile.power);
                if (amount <= 0) {
                    return false;
                }
                tacticalTile.addEffect('divertTacticalLoss', amount);
                system.addEffect('divertTacticalGain', amount);
                return true;
            },
        },
        overcharge: {
            aiEvaluator: powerBoostEvaluator('overcharge', 35, 'overcharge'),
            play: (_gameState, _ship, system) => {
                return system.addEffect('overcharge');
            },
        },
        shunt: {
            play: (_gameState, ship, system) => {
                const systemIndex = ship.engineerState.systems.indexOf(system);
                const neighborIndex = systemIndex ^ 1;
                const neighbor = ship.engineerState.systems[neighborIndex];

                const UNTRANSFERABLE: ReadonlySet<SystemEffectType> = new Set(['resetting', 'reactorBreach', 'relocating']);

                // Save transferable effects from both systems.
                type SavedEffect = { type: SystemEffectType; level: number; progress: CooldownState | null };
                const systemEffects: SavedEffect[] = [];
                const neighborEffects: SavedEffect[] = [];

                for (const e of system.effects) {
                    if (!UNTRANSFERABLE.has(e.type)) {
                        systemEffects.push({ type: e.type, level: e.level, progress: e.progress });
                    }
                }
                for (const e of neighbor.effects) {
                    if (!UNTRANSFERABLE.has(e.type)) {
                        neighborEffects.push({ type: e.type, level: e.level, progress: e.progress });
                    }
                }

                // Remove transferable effects from both systems (properly undoes power adjustments etc.)
                for (const e of systemEffects) {
                    system.removeEffect(e.type, 'expired');
                }
                for (const e of neighborEffects) {
                    neighbor.removeEffect(e.type, 'expired');
                }

                // Add neighbor's old effects to system (and vice versa), consolidating leveled effects.
                applySwappedEffects(system, neighborEffects);
                applySwappedEffects(neighbor, systemEffects);

                return true;
            },
        },
        drawPriority: {
            play: (_gameState, ship, system) => {
                const cardType = getReactorCardTypeForSystem(system.system);

                // Before every non-expendable card in the reactor deck, add an expendable copy of this system's corresponding reactor card.
                for (let index = 0; index < ship.reactorState.deck.length; index++) {
                    const destinationCard = ship.reactorState.deck[index];
                    if (!destinationCard.hasTrait('expendable')) {
                        const newCard = CardState.createExpendable(cardType, ship.getCardId());
                        ship.reactorState.deck.splice(index, 0, newCard);
                        index++;
                    }
                }

                // Recalculate each system's card generation cooldowns after modifying the reactor deck.
                ship.updateCardGeneration();

                return true;
            },
        },
    },
    effects: {
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
    },
});
