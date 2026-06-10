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
import { SystemEffectPolarity } from 'common-data/features/ships/types/SystemEffectDefinition';
import { LeveledSystemEffectType, SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { Ship } from 'src/state/Ship';
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
                return true;
            },
            fire: (gameState, ship, target, parameters) => {
                if (target && parameters.damage) {
                    target.damage({
                        amount: parameters.damage,
                        damageType: 'coherent',
                        deliveryMethod: 'beam',
                    });
                }

                gameState.broadcastWeaponEffect({
                    type: 'beam',
                    sourceId: ship.id,
                    targetId: target?.id,
                    color: '#ff4400',
                    thickness: 0.15,
                    brightness: 1.5,
                    duration: 600,
                    startTime: gameState.currentTime,
                });

                return true;
            },
        },
        phaserStrip: {
            load: (_gameState, _ship, _slot) => {
                return true;
            },
            fire: (gameState, ship, target, parameters) => {
                if (target && parameters.damage) {
                    target.damage({
                        amount: parameters.damage,
                        damageType: 'coherent',
                        deliveryMethod: 'beam',
                    });
                }

                gameState.broadcastWeaponEffect({
                    type: 'beam',
                    sourceId: ship.id,
                    targetId: target?.id,
                    color: '#ff8800',
                    thickness: 0.1,
                    brightness: 1.2,
                    duration: 800,
                    startTime: gameState.currentTime,
                });

                return true;
            },
        },
        photonTorpedo: {
            load: (_gameState, _ship, _slot) => {
                return true;
            },
            fire: (gameState, ship, target, parameters) => {
                if (target && parameters.damage) {
                    target.damage({
                        amount: parameters.damage,
                        damageType: 'antimatter',
                        deliveryMethod: 'projectile',
                    });
                }

                gameState.broadcastWeaponEffect({
                    type: 'projectile',
                    sourceId: ship.id,
                    targetId: target?.id,
                    color: '#00ccff',
                    thickness: 0.2,
                    brightness: 2,
                    duration: 1200,
                    startTime: gameState.currentTime,
                });

                return true;
            },
        },
        photonicCannon: {
            load: (_gameState, _ship, _slot) => {
                return true;
            },
            fire: (gameState, ship, target, parameters) => {
                if (target && parameters.damage) {
                    target.damage({
                        amount: parameters.damage,
                        damageType: 'coherent',
                        deliveryMethod: 'beam',
                    });
                }

                gameState.broadcastWeaponEffect({
                    type: 'beam',
                    sourceId: ship.id,
                    targetId: target?.id,
                    color: '#ffcc00',
                    thickness: 0.25,
                    brightness: 2,
                    duration: 1000,
                    startTime: gameState.currentTime,
                });

                return true;
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
                const currentDamageType = slot.getDamageType();
                if (currentDamageType === 'ion') {
                    // Weapon is already ion type, increase damage by 50%
                    const damageMultiplier = parameters.damageMultiplier ?? 50;
                    const currentDamage = slot.getParameter('damage');
                    slot.adjustParameter('damage', Math.round(currentDamage * damageMultiplier / 100));
                } else {
                    // Change damage type to ion
                    slot.damageType = 'ion';
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
            prime: (_gameState, _ship, slot) => {
                slot.damageType = 'ion';
                return true;
            },
            charge: (gameState, _ship, slot, parameters) => {
                slot.addCharge(parameters.cost, gameState.clock.currentTime);
                return true;
            },
        },
        plasmaConversion: {
            prime: (_gameState, _ship, slot) => {
                slot.damageType = 'plasma';
                return true;
            },
            charge: (gameState, _ship, slot, parameters) => {
                slot.addCharge(parameters.cost, gameState.clock.currentTime);
                return true;
            },
        },
        disruptorConversion: {
            prime: (_gameState, _ship, slot) => {
                slot.damageType = 'disruptor';
                return true;
            },
            charge: (gameState, _ship, slot, parameters) => {
                slot.addCharge(parameters.cost, gameState.currentTime);
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
                const negativeEffect = system.effects.find(
                    e => getSystemEffectDefinition(e.type).polarity === SystemEffectPolarity.Negative
                );

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
        scan: {
            load: () => {
                return true;
            },
            play: (_gameState, ship, target, targetSystem) => {
                if (!(target instanceof Ship) || targetSystem === null) {
                    return false;
                }

                // TODO: duration
                // TODO: delay?
                ship.scienceState.subscribeToSystem(target, targetSystem, true);
                return true;
            },
        },
        scanPulse: {
            load: () => {
                return true;
            },
            play: () => {
                return true;
            },
        },
        tetryonScan: {
            load: () => {
                return true;
            },
            play: () => {
                return true;
            },
        },
        phasedPolaronBeamScan: {
            load: () => {
                return true;
            },
            play: () => {
                return true;
            },
        },
        deflectorPhasedAntiprotonBeam: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Phased Antiproton Beam deflector effect
                return true;
            },
        },
        deflectorPhasedAntiprotonPulse: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Phased Antiproton Pulse deflector effect
                return true;
            },
        },
        deflectorPhasedAntiprotonBurst: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Phased Antiproton Burst deflector effect
                return true;
            },
        },
        deflectorPhasedAntiprotonWave: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Phased Antiproton Wave deflector effect
                return true;
            },
        },
        deflectorPhasedTetryonBeam: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Phased Tetryon Beam deflector effect
                return true;
            },
        },
        deflectorPhasedTetryonPulse: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Phased Tetryon Pulse deflector effect
                return true;
            },
        },
        deflectorPhasedTetryonBurst: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Phased Tetryon Burst deflector effect
                return true;
            },
        },
        deflectorPhasedTetryonWave: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Phased Tetryon Wave deflector effect
                return true;
            },
        },
        deflectorPhasedChronitonBeam: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Phased Chroniton Beam deflector effect
                return true;
            },
        },
        deflectorPhasedChronitonPulse: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Phased Chroniton Pulse deflector effect
                return true;
            },
        },
        deflectorPhasedChronitonBurst: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Phased Chroniton Burst deflector effect
                return true;
            },
        },
        deflectorPhasedChronitonWave: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Phased Chroniton Wave deflector effect
                return true;
            },
        },
        deflectorPhasedGravitonBeam: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Phased Graviton Beam deflector effect
                return true;
            },
        },
        deflectorPhasedGravitonPulse: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Phased Graviton Pulse deflector effect
                return true;
            },
        },
        deflectorPhasedGravitonBurst: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Phased Graviton Burst deflector effect
                return true;
            },
        },
        deflectorPhasedGravitonWave: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Phased Graviton Wave deflector effect
                return true;
            },
        },
        deflectorPhasedPolaronBeam: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Phased Polaron Beam deflector effect
                return true;
            },
        },
        deflectorPhasedPolaronPulse: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Phased Polaron Pulse deflector effect
                return true;
            },
        },
        deflectorPhasedPolaronBurst: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Phased Polaron Burst deflector effect
                return true;
            },
        },
        deflectorPhasedPolaronWave: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Phased Polaron Wave deflector effect
                return true;
            },
        },
        deflectorCoherentAntiprotonBeam: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Coherent Antiproton Beam deflector effect
                return true;
            },
        },
        deflectorCoherentAntiprotonPulse: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Coherent Antiproton Pulse deflector effect
                return true;
            },
        },
        deflectorCoherentAntiprotonBurst: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Coherent Antiproton Burst deflector effect
                return true;
            },
        },
        deflectorCoherentAntiprotonWave: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Coherent Antiproton Wave deflector effect
                return true;
            },
        },
        deflectorCoherentTetryonBeam: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Coherent Tetryon Beam deflector effect
                return true;
            },
        },
        deflectorCoherentTetryonPulse: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Coherent Tetryon Pulse deflector effect
                return true;
            },
        },
        deflectorCoherentTetryonBurst: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Coherent Tetryon Burst deflector effect
                return true;
            },
        },
        deflectorCoherentTetryonWave: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Coherent Tetryon Wave deflector effect
                return true;
            },
        },
        deflectorCoherentChronitonBeam: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Coherent Chroniton Beam deflector effect
                return true;
            },
        },
        deflectorCoherentChronitonPulse: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Coherent Chroniton Pulse deflector effect
                return true;
            },
        },
        deflectorCoherentChronitonBurst: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Coherent Chroniton Burst deflector effect
                return true;
            },
        },
        deflectorCoherentChronitonWave: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Coherent Chroniton Wave deflector effect
                return true;
            },
        },
        deflectorCoherentGravitonBeam: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Coherent Graviton Beam deflector effect
                return true;
            },
        },
        deflectorCoherentGravitonPulse: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Coherent Graviton Pulse deflector effect
                return true;
            },
        },
        deflectorCoherentGravitonBurst: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Coherent Graviton Burst deflector effect
                return true;
            },
        },
        deflectorCoherentGravitonWave: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Coherent Graviton Wave deflector effect
                return true;
            },
        },
        deflectorCoherentPolaronBeam: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Coherent Polaron Beam deflector effect
                return true;
            },
        },
        deflectorCoherentPolaronPulse: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Coherent Polaron Pulse deflector effect
                return true;
            },
        },
        deflectorCoherentPolaronBurst: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Coherent Polaron Burst deflector effect
                return true;
            },
        },
        deflectorCoherentPolaronWave: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Coherent Polaron Wave deflector effect
                return true;
            },
        },
        deflectorInvertedAntiprotonBeam: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Inverted Antiproton Beam deflector effect
                return true;
            },
        },
        deflectorInvertedAntiprotonPulse: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Inverted Antiproton Pulse deflector effect
                return true;
            },
        },
        deflectorInvertedAntiprotonBurst: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Inverted Antiproton Burst deflector effect
                return true;
            },
        },
        deflectorInvertedAntiprotonWave: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Inverted Antiproton Wave deflector effect
                return true;
            },
        },
        deflectorInvertedTetryonBeam: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Inverted Tetryon Beam deflector effect
                return true;
            },
        },
        deflectorInvertedTetryonPulse: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Inverted Tetryon Pulse deflector effect
                return true;
            },
        },
        deflectorInvertedTetryonBurst: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Inverted Tetryon Burst deflector effect
                return true;
            },
        },
        deflectorInvertedTetryonWave: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Inverted Tetryon Wave deflector effect
                return true;
            },
        },
        deflectorInvertedChronitonBeam: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Inverted Chroniton Beam deflector effect
                return true;
            },
        },
        deflectorInvertedChronitonPulse: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Inverted Chroniton Pulse deflector effect
                return true;
            },
        },
        deflectorInvertedChronitonBurst: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Inverted Chroniton Burst deflector effect
                return true;
            },
        },
        deflectorInvertedChronitonWave: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Inverted Chroniton Wave deflector effect
                return true;
            },
        },
        deflectorInvertedGravitonBeam: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Inverted Graviton Beam deflector effect
                return true;
            },
        },
        deflectorInvertedGravitonPulse: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Inverted Graviton Pulse deflector effect
                return true;
            },
        },
        deflectorInvertedGravitonBurst: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Inverted Graviton Burst deflector effect
                return true;
            },
        },
        deflectorInvertedGravitonWave: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Inverted Graviton Wave deflector effect
                return true;
            },
        },
        deflectorInvertedPolaronBeam: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Inverted Polaron Beam deflector effect
                return true;
            },
        },
        deflectorInvertedPolaronPulse: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Inverted Polaron Pulse deflector effect
                return true;
            },
        },
        deflectorInvertedPolaronBurst: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Inverted Polaron Burst deflector effect
                return true;
            },
        },
        deflectorInvertedPolaronWave: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Inverted Polaron Wave deflector effect
                return true;
            },
        },
        deflectorModulatedAntiprotonBeam: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Modulated Antiproton Beam deflector effect
                return true;
            },
        },
        deflectorModulatedAntiprotonPulse: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Modulated Antiproton Pulse deflector effect
                return true;
            },
        },
        deflectorModulatedAntiprotonBurst: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Modulated Antiproton Burst deflector effect
                return true;
            },
        },
        deflectorModulatedAntiprotonWave: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Modulated Antiproton Wave deflector effect
                return true;
            },
        },
        deflectorModulatedTetryonBeam: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Modulated Tetryon Beam deflector effect
                return true;
            },
        },
        deflectorModulatedTetryonPulse: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Modulated Tetryon Pulse deflector effect
                return true;
            },
        },
        deflectorModulatedTetryonBurst: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Modulated Tetryon Burst deflector effect
                return true;
            },
        },
        deflectorModulatedTetryonWave: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Modulated Tetryon Wave deflector effect
                return true;
            },
        },
        deflectorModulatedChronitonBeam: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Modulated Chroniton Beam deflector effect
                return true;
            },
        },
        deflectorModulatedChronitonPulse: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Modulated Chroniton Pulse deflector effect
                return true;
            },
        },
        deflectorModulatedChronitonBurst: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Modulated Chroniton Burst deflector effect
                return true;
            },
        },
        deflectorModulatedChronitonWave: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Modulated Chroniton Wave deflector effect
                return true;
            },
        },
        deflectorModulatedGravitonBeam: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Modulated Graviton Beam deflector effect
                return true;
            },
        },
        deflectorModulatedGravitonPulse: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Modulated Graviton Pulse deflector effect
                return true;
            },
        },
        deflectorModulatedGravitonBurst: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Modulated Graviton Burst deflector effect
                return true;
            },
        },
        deflectorModulatedGravitonWave: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Modulated Graviton Wave deflector effect
                return true;
            },
        },
        deflectorModulatedPolaronBeam: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Modulated Polaron Beam deflector effect
                return true;
            },
        },
        deflectorModulatedPolaronPulse: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Modulated Polaron Pulse deflector effect
                return true;
            },
        },
        deflectorModulatedPolaronBurst: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Modulated Polaron Burst deflector effect
                return true;
            },
        },
        deflectorModulatedPolaronWave: {
            play: (_gameState, _ship, _target) => {
                // TODO: implement Modulated Polaron Wave deflector effect
                return true;
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
