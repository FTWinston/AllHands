import {
    CardType,
    DeflectorTargetedCardType,
    EnemyTargetedCardType,
    LocationTargetedCardType,
    SystemSlotTargetedCardType,
    UntargetedCardType,
    WeaponSlotTargetedCardType,
    WeaponTargetedCardType,
    cardDefinitions,
} from 'common-data/features/cards/utils/cardDefinitions';
import { LeveledSystemEffectType, SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { damageTypeIndex } from 'common-data/features/space/types/Damage';
import { getSystemEffectDefinition } from '../effects/getEngineSystemEffectDefinition';
import { CooldownState } from '../state/CooldownState';
import { EngineerSystemTile } from '../state/systems/engineer/EngineerSystemTile';
import { applyMotionCard } from './applyMotionCard';
import {
    NoTargetCardFunctionality,
    WeaponSlotTargetCardFunctionality,
    WeaponTargetCardFunctionality,
    EnemyTargetCardFunctionality,
    DeflectorTargetCardFunctionality,
    SystemTargetCardFunctionality,
    LocationTargetCardFunctionality,
    EngineCardDefinition,
    EngineCardFunctionality,
    EngineWeaponSlotCardDefinition,
    EngineWeaponTargetCardDefinition,
    EngineLocationTargetCardDefinition,
    EngineSystemTargetCardDefinition,
    EngineEnemyTargetCardDefinition,
    EngineDeflectorTargetCardDefinition,
    EngineNoTargetCardDefinition,
} from './EngineCardDefinition';

type CardFunctionalityLookup = Record<UntargetedCardType, NoTargetCardFunctionality>
    & Record<WeaponSlotTargetedCardType, WeaponSlotTargetCardFunctionality>
    & Record<WeaponTargetedCardType, WeaponTargetCardFunctionality>
    & Record<SystemSlotTargetedCardType, SystemTargetCardFunctionality>
    & Record<EnemyTargetedCardType, EnemyTargetCardFunctionality>
    & Record<DeflectorTargetedCardType, DeflectorTargetCardFunctionality>
    & Record<LocationTargetedCardType, LocationTargetCardFunctionality>;

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

function loadCardDefinitions() {
    const cardFunctionalities: CardFunctionalityLookup = {
        flare: {
            play: (_ship) => {
                console.log('played flare'); return true;
            },
        },
        smokeScreen: {
            play: (_ship) => {
                console.log('played smokeScreen'); return true;
            },
        },
        phaserCannon: {
            load: (_gameState, _ship, _slot) => {
                console.log('played phaserCannon'); return true;
            },
            fire: (_gameState, _ship, _target, _parameters) => {
                console.log('fired phaserCannon'); return true;
            },
        },
        phaserStrip: {
            load: (_gameState, _ship, _slot) => {
                console.log('played phaserStrip'); return true;
            },
            fire: (_gameState, _ship, _target, _parameters) => {
                console.log('fired phaserStrip'); return true;
            },
        },
        photonTorpedo: {
            load: (_gameState, _ship, _slot) => {
                console.log('played photonTorpedo'); return true;
            },
            fire: (_gameState, _ship, _target, _parameters) => {
                console.log('fired photonTorpedo'); return true;
            },
        },
        photonicCannon: {
            load: (_gameState, _ship, _slot) => {
                console.log('played photonicCannon'); return true;
            },
            fire: (_gameState, _ship, _target, _parameters) => {
                console.log('fired photonicCannon'); return true;
            },
        },

        quickCharge: {
            prime: (_gameState, _ship, slot, parameters) => {
                const damageReduction = parameters.damageReduction ?? 5;
                const chargeReduction = parameters.chargeReduction ?? 2;
                slot.adjustParameter('damage', -damageReduction);
                slot.adjustParameter('chargeCost', -chargeReduction);
                return true;
            },
            charge: (gameState, _ship, slot, parameters) => {
                slot.addCharge(parameters.cost, gameState.clock.currentTime);
                return true;
            },
        },
        heavyCharge: {
            prime: (_gameState, _ship, slot, parameters) => {
                const damageIncrease = parameters.damageIncrease ?? 10;
                const chargeIncrease = parameters.chargeIncrease ?? 2;
                slot.adjustParameter('damage', damageIncrease);
                slot.adjustParameter('chargeCost', chargeIncrease);
                return true;
            },
            charge: (gameState, _ship, slot, parameters) => {
                slot.addCharge(parameters.cost, gameState.clock.currentTime);
                return true;
            },
        },
        extraAmmo: {
            prime: (_gameState, _ship, slot, parameters) => {
                const extraUses = parameters.extraUses ?? 1;
                slot.adjustParameter('uses', extraUses);
                return true;
            },
            charge: (gameState, _ship, slot, parameters) => {
                slot.addCharge(parameters.cost, gameState.clock.currentTime);
                return true;
            },
        },
        chargeX: {
            prime: (_gameState, ship, slot) => {
                const chargeAmount = ship.tacticalState.powerLevel;
                slot.addCharge(chargeAmount, _gameState.clock.currentTime);
                return true;
            },
            charge: (_gameState, ship, slot) => {
                const chargeAmount = ship.tacticalState.powerLevel;
                slot.addCharge(chargeAmount, _gameState.clock.currentTime);
                return true;
            },
        },
        weaponOvercharge: {
            prime: (_gameState, _ship, slot, parameters) => {
                const capacityIncrease = parameters.capacityIncrease ?? 3;
                const damageMultiplier = parameters.damageMultiplier ?? 50;
                slot.adjustParameter('chargeCost', capacityIncrease);
                const currentDamage = slot.getParameter('damage');
                slot.adjustParameter('damage', Math.round(currentDamage * damageMultiplier / 100));
                return true;
            },
            charge: (gameState, _ship, slot, parameters) => {
                const charge = parameters.charge ?? 2;
                slot.addCharge(charge, gameState.clock.currentTime);
                return true;
            },
        },
        ionicSurge: {
            prime: (_gameState, _ship, slot, parameters) => {
                const currentDamageType = slot.getParameter('damageType');
                if (currentDamageType === damageTypeIndex.ion) {
                    // Weapon is already ion type, increase damage by 50%
                    const damageMultiplier = parameters.damageMultiplier ?? 50;
                    const currentDamage = slot.getParameter('damage');
                    slot.adjustParameter('damage', Math.round(currentDamage * damageMultiplier / 100));
                } else {
                    // Change damage type to ion
                    slot.adjustParameter('damageType', damageTypeIndex.ion);
                }
                return true;
            },
            charge: (gameState, _ship, slot, parameters) => {
                const charge = parameters.charge ?? 1;
                slot.addCharge(charge, gameState.clock.currentTime);
                return true;
            },
        },
        ionConversion: {
            prime: (_gameState, _ship, slot, parameters) => {
                slot.adjustParameter('damageType', parameters.damageType ?? damageTypeIndex.ion);
                return true;
            },
            charge: (gameState, _ship, slot, parameters) => {
                slot.addCharge(parameters.cost, gameState.clock.currentTime);
                return true;
            },
        },
        plasmaConversion: {
            prime: (_gameState, _ship, slot, parameters) => {
                slot.adjustParameter('damageType', parameters.damageType ?? damageTypeIndex.plasma);
                return true;
            },
            charge: (gameState, _ship, slot, parameters) => {
                slot.addCharge(parameters.cost, gameState.clock.currentTime);
                return true;
            },
        },
        disruptorConversion: {
            prime: (_gameState, _ship, slot, parameters) => {
                slot.adjustParameter('damageType', parameters.damageType ?? damageTypeIndex.disruptor);
                return true;
            },
            charge: (gameState, _ship, slot, parameters) => {
                slot.addCharge(parameters.cost, gameState.clock.currentTime);
                return true;
            },
        },
        exampleEnemyTarget: {
            play: (_gameState, _ship, _target) => {
                console.log('played exampleEnemyTarget'); return true;
            },
        },
        slowAndSteady: {
            play: applyMotionCard,
        },
        fullReverse: {
            play: applyMotionCard,
        },
        zigZag: {
            play: applyMotionCard,
        },
        strafe: {
            play: applyMotionCard,
        },
        sweepLeft: {
            play: applyMotionCard,
        },
        sweepRight: {
            play: applyMotionCard,
        },
        faceTarget: {
            play: applyMotionCard,
        },
        exampleNoTarget: {
            play: (_gameState, _ship) => {
                console.log('played exampleNoTarget'); return true;
            },
        },
        auxPower: {
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
                ship.engineerState.onSystemsSwapped(systemIndex, otherSystemIndex);
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
                ship.engineerState.onSystemsSwapped(systemIndex, otherSystemIndex);
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
                ship.engineerState.onSystemsSwapped(systemIndex, otherSystemIndex);
                return true;
            },
        },
        purge: {
            play: (_gameState, _ship, system) => {
                const negativeEffect = system.effects.find(e => !getSystemEffectDefinition(e.type).positive);

                if (!negativeEffect) {
                    return false;
                }

                system.removeEffect(negativeEffect.type, true);
                return true;
            },
        },
        reset: {
            play: (_gameState, _ship, system) => {
                system.addEffect('resetting');
                return true;
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
                ship.engineerState.onSystemsSwapped(systemIndex, relocatingIndex);
                relocatingSystem.removeEffect('relocating', true);
                return true;
            },
        },
        sustain: {
            play: (gameState, _ship, system) => {
                const currentTime = gameState.clock.currentTime;
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
                    system.removeEffect(e.type, false);
                }
                for (const e of neighborEffects) {
                    neighbor.removeEffect(e.type, false);
                }

                // Add neighbor's old effects to system (and vice versa), consolidating leveled effects.
                applySwappedEffects(system, neighborEffects);
                applySwappedEffects(neighbor, systemEffects);

                return true;
            },
        },
        generationPriority: {
            play: (_gameState, _ship, system) => {
                return system.addEffect('generationPriority');
            },
        },
    };

    const engineCardDefinitions = Object.entries(cardDefinitions)
        .reduce((acc, [type, def]) => {
            const functionality = (cardFunctionalities as Record<CardType, EngineCardFunctionality>)[type as CardType];
            acc[type as CardType] = { ...def, ...functionality } as EngineCardDefinition;
            return acc;
        }, {} as Record<CardType, EngineCardDefinition>);
    return engineCardDefinitions;
}

const engineCardDefinitions = loadCardDefinitions();

export function getCardDefinition(type: WeaponSlotTargetedCardType): EngineWeaponSlotCardDefinition;
export function getCardDefinition(type: WeaponTargetedCardType): EngineWeaponTargetCardDefinition;
export function getCardDefinition(type: LocationTargetedCardType): EngineLocationTargetCardDefinition;
export function getCardDefinition(type: SystemSlotTargetedCardType): EngineSystemTargetCardDefinition;
export function getCardDefinition(type: EnemyTargetedCardType): EngineEnemyTargetCardDefinition;
export function getCardDefinition(type: DeflectorTargetedCardType): EngineDeflectorTargetCardDefinition;
export function getCardDefinition(type: UntargetedCardType): EngineNoTargetCardDefinition;
export function getCardDefinition(type: CardType): EngineCardDefinition;
export function getCardDefinition(type: CardType): EngineCardDefinition {
    const cardDef = engineCardDefinitions[type];

    if (!cardDef) {
        throw new Error(`Card definition not found: ${type}`);
    }

    return cardDef;
};
