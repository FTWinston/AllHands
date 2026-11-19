import { WeaponTrait } from 'common-data/features/cards/types/CardTrait';
import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { ShipSystem, isCrewSystem } from 'common-data/features/ships/types/ShipSystem';
import { FiringState } from 'common-data/features/space/types/FiringState';
import { projectileFlightTime } from 'common-data/features/space/types/WeaponEffect';
import { getFiringSolution } from 'common-data/features/space/utils/getFiringSolution';
import { getFiringState } from 'common-data/features/space/utils/getFiringState';
import { engageTractorBeam, isHoldingInTractorBeam, releaseTractorBeam } from 'content/systems/tactical/effects/tacticalEffects.engine';
import { effects as sharedEffects } from 'content/systems/tactical/effects/tacticalEffects.shared';
import { weaponLoadEvaluator, weaponModifierEvaluator } from 'engine/ai/evaluators/tactical';
import { defineEngineCards } from 'engine/content/EngineContent';
import { GameObject } from 'engine/state/GameObject';
import { cards as sharedCards } from './tacticalCards.shared';
import type { CardParameters } from 'common-data/features/cards/types/CardParameters';
import type { Damage } from 'common-data/features/space/types/Damage';
import type { IRandom } from 'common-data/types/IRandom';
import type { GameState } from 'engine/state/GameState';
import type { Ship } from 'engine/state/Ship';
import type { WeaponSlotState } from 'engine/state/systems/tactical/WeaponSlotState';

/** The most Lock that can be held against a ship. */
const maxLockLevel = sharedEffects.lock.maxLevel;

function isShip(object: GameObject): object is Ship {
    return 'helmState' in object;
}

/** Set total charge to exactly one use's worth. */
function setTotalToOneUse(slot: WeaponSlotState) {
    slot.adjustParameter('totalCharge', slot.getParameter('chargePerUse') - slot.getParameter('totalCharge'));
}

/** Raise total charge to one use's worth if it is currently lower. */
function ensureTotalCoversOneUse(slot: WeaponSlotState) {
    const shortfall = slot.getParameter('chargePerUse') - slot.getParameter('totalCharge');
    if (shortfall > 0) {
        slot.adjustParameter('totalCharge', shortfall);
    }
}

/** Change the charge per use (minimum 1), without reducing total charge below one use. */
function adjustChargePerUse(slot: WeaponSlotState, adjustment: number) {
    const current = slot.getParameter('chargePerUse');
    slot.adjustParameter('chargePerUse', Math.max(1, current + adjustment) - current);
    ensureTotalCoversOneUse(slot);
}

function scaleParameter(slot: WeaponSlotState, parameter: string, percent: number) {
    const current = slot.getParameter(parameter);
    slot.adjustParameter(parameter, Math.round(current * percent / 100) - current);
}

function getTargetEvasion(target: GameObject): number {
    if (isShip(target)) {
        const activeCard = target.helmState.activeManeuver?.card;
        return activeCard?.getParameter('evasion') ?? 0;
    }
    return 0;
}

function rollToHit(random: IRandom, evasion: number, accuracy: number): boolean {
    const hitChance = Math.max(0, accuracy - evasion);
    return random.getBoolean(hitChance / 100);
}

function getTargetPosition(target: GameObject | null, time: number) {
    if (!target) {
        return undefined;
    }
    const { x, y } = target.getPosition(time);
    return { x, y };
}

/**
 * Show a system of a ship to the science of the ship that hit it, as scanning it would. Only systems with a crew can be scanned.
 * Science is left alone if it's scanning something already, as a hit shouldn't take its scan away from it.
 */
function revealToScience(ship: Ship, target: Ship, system: ShipSystem) {
    if (!isCrewSystem(system) || ship.scienceState.getScannedSystemTarget()) {
        return;
    }

    ship.scienceState.subscribeToSystem(target, system);
}

/**
 * Fire a weapon at a target, telling clients to show that. Whether it will hit is settled now, but any damage lands when the shot arrives.
 * A target that's gone by then takes no damage: the shot just carries on to where it was.
 */
function fireShot(
    gameState: GameState,
    ship: Ship,
    target: GameObject | null,
    weapon: string,
    accuracy: number,
    parameters: CardParameters,
    traits: WeaponTrait[],
    targetSystem: ShipSystem | null,
    flightTime = 0
) {
    const damageAmount = parameters.damage;
    const hits = !!target && !!damageAmount && rollToHit(gameState.random, getTargetEvasion(target), accuracy);

    gameState.broadcastWeaponEffect({
        type: 'shot',
        weapon,
        sourceId: ship.id,
        targetId: target?.id,
        targetPosition: getTargetPosition(target, gameState.currentTime),
        missed: hits ? undefined : true,
        startTime: gameState.currentTime,
    });

    if (!hits) {
        return;
    }

    const land = () => {
        if (gameState.objects.get(target.id) !== target) {
            return;
        }

        // An aimed shot lands on the system aimed at. Otherwise the target decides where it lands.
        const hit: Damage = {
            amount: damageAmount,
            traits,
            targetSystem: targetSystem ?? undefined,
            sourceId: ship.id,
            sparesHull: !!parameters['sparesHull'] || undefined,
        };
        const damage = target.damage(hit);

        // A tracer shows science the system it hit, as a scan would. It's the system the hit landed on, which a hit that wasn't aimed has picked by now.
        if (parameters['tracer'] && isShip(target) && hit.targetSystem) {
            revealToScience(ship, target, hit.targetSystem);
        }

        if (isShip(target)) {
            gameState.broadcastWeaponEffect({
                type: 'impact',
                sourceId: ship.id,
                targetId: target.id,
                damage,
                system: hit.targetSystem,
                startTime: gameState.currentTime,
            });
        }
    };

    if (flightTime > 0) {
        gameState.setTimeout(land, flightTime);
    } else {
        land();
    }
}

export const cards = defineEngineCards(sharedCards, {
    flare: {
        play: (_gameState, ship) => {
            const tactical = ship.engineerState.systems.find(tile => tile.system === 'tactical');
            if (!tactical) {
                return false;
            }

            // Launching another while one is burning starts its time over, as adding an effect that's already there does.
            tactical.addEffect('flareBurning');
            return true;
        },
    },
    phaserCannon: {
        synergy: { provides: ['energyWeapon'] },
        aiEvaluator: weaponLoadEvaluator('phaserCannon'),
        load: (_gameState, _ship, _slot) => {
            return true;
        },
        fire: (gameState, ship, target, parameters, accuracy, weaponTraits, targetSystem) => {
            fireShot(gameState, ship, target, 'phaserCannon', accuracy, parameters, weaponTraits, targetSystem);
            return true;
        },
    },
    phaserStrip: {
        synergy: { provides: ['energyWeapon'] },
        aiEvaluator: weaponLoadEvaluator('phaserStrip'),
        load: (_gameState, _ship, _slot) => {
            return true;
        },
        fire: (gameState, ship, target, parameters, accuracy, weaponTraits, targetSystem) => {
            fireShot(gameState, ship, target, 'phaserStrip', accuracy, parameters, weaponTraits, targetSystem);
            return true;
        },
    },
    photonicCannon: {
        synergy: { provides: ['energyWeapon'], wants: ['weaponCharge'] },
        aiEvaluator: weaponLoadEvaluator('photonicCannon'),
        load: (_gameState, _ship, _slot) => {
            return true;
        },
        fire: (gameState, ship, target, parameters, accuracy, weaponTraits, targetSystem) => {
            fireShot(gameState, ship, target, 'photonicCannon', accuracy, parameters, weaponTraits, targetSystem);
            return true;
        },
    },
    photonTorpedo: {
        synergy: { provides: ['torpedoWeapon'] },
        aiEvaluator: weaponLoadEvaluator('photonTorpedo'),
        load: (_gameState, _ship, _slot) => {
            return true;
        },
        fire: (gameState, ship, target, parameters, accuracy, weaponTraits, targetSystem) => {
            fireShot(gameState, ship, target, 'photonTorpedo', accuracy, parameters, weaponTraits, targetSystem, projectileFlightTime);
            return true;
        },
    },
    quantumTorpedo: {
        synergy: { provides: ['torpedoWeapon'] },
        aiEvaluator: weaponLoadEvaluator('quantumTorpedo'),
        load: (_gameState, _ship, _slot) => {
            return true;
        },
        fire: (gameState, ship, target, parameters, accuracy, weaponTraits, targetSystem) => {
            fireShot(gameState, ship, target, 'quantumTorpedo', accuracy, parameters, weaponTraits, targetSystem, projectileFlightTime);
            return true;
        },
    },
    siegeLance: {
        synergy: { provides: ['energyWeapon'], wants: ['lock'] },
        aiEvaluator: weaponLoadEvaluator('siegeLance'),
        load: (_gameState, _ship, _slot) => {
            return true;
        },
        fire: (gameState, ship, target, parameters, accuracy, weaponTraits, targetSystem) => {
            fireShot(gameState, ship, target, 'siegeLance', accuracy, parameters, weaponTraits, targetSystem);
            return true;
        },
    },
    lowYield: {
        synergy: { wants: ['torpedoWeapon'] },
        aiEvaluator: weaponModifierEvaluator('lowYield'),
        prime: (_gameState, _ship, slot, parameters) => {
            slot.adjustParameter('damage', -(parameters.damageReduction ?? 6));
            adjustChargePerUse(slot, -(parameters.chargeReduction ?? 2));
            setTotalToOneUse(slot);
            return true;
        },
    },
    highYield: {
        synergy: { wants: ['torpedoWeapon'] },
        aiEvaluator: weaponModifierEvaluator('highYield'),
        prime: (_gameState, _ship, slot, parameters) => {
            slot.adjustParameter('damage', parameters.damageIncrease ?? 12);
            adjustChargePerUse(slot, parameters.chargeIncrease ?? 2);
            setTotalToOneUse(slot);
            return true;
        },
    },
    extendedRange: {
        synergy: { wants: ['torpedoWeapon'] },
        aiEvaluator: weaponModifierEvaluator('extendedRange'),
        prime: (_gameState, _ship, slot, parameters) => {
            slot.adjustParameter('damage', -(parameters.damageReduction ?? 2));
            slot.adjustParameter('maxRange', parameters.maxRangeIncrease ?? 5);
            slot.adjustParameter('minRange', parameters.minRangeIncrease ?? 2);
            return true;
        },
    },
    projectileManoeuvrability: {
        synergy: { wants: ['torpedoWeapon'] },
        aiEvaluator: weaponModifierEvaluator('projectileManoeuvrability'),
        prime: (_gameState, _ship, slot, parameters) => {
            adjustChargePerUse(slot, parameters.chargeIncrease ?? 1);
            slot.adjustParameter('firingArc', parameters.firingArcIncrease ?? 0.5);
            slot.adjustParameter('accuracy', parameters.accuracyIncrease ?? 20);
            return true;
        },
    },
    fullSpread: {
        synergy: { wants: ['torpedoWeapon', 'lock'] },
        aiEvaluator: weaponModifierEvaluator('fullSpread', 2),
        prime: (_gameState, _ship, slot, parameters) => {
            slot.adjustParameter('damage', -(parameters.damageReduction ?? 4));
            const current = slot.getParameter('chargePerUse');
            adjustChargePerUse(slot, Math.round(current * (parameters.chargeMultiplier ?? 250) / 100) - current);
            setTotalToOneUse(slot);
            slot.adjustParameter('accuracy', -(parameters.accuracyReduction ?? 15));
            slot.adjustParameter('extraShots', parameters.extraShots ?? 2);
            return true;
        },
    },
    highIntensity: {
        synergy: { wants: ['energyWeapon'] },
        aiEvaluator: weaponModifierEvaluator('highIntensity'),
        prime: (_gameState, _ship, slot, parameters) => {
            slot.adjustParameter('damage', parameters.damageIncrease ?? 4);
            // Keep the arc positive so the weapon can still fire.
            const arc = slot.getParameter('firingArc');
            slot.adjustParameter('firingArc', Math.max(0.1, arc - (parameters.firingArcReduction ?? 0.25)) - arc);
            adjustChargePerUse(slot, parameters.chargeIncrease ?? 1);
            return true;
        },
    },
    lensingEnhancement: {
        synergy: { wants: ['energyWeapon'] },
        aiEvaluator: weaponModifierEvaluator('lensingEnhancement'),
        prime: (_gameState, _ship, slot, parameters) => {
            slot.adjustParameter('firingArc', parameters.firingArcIncrease ?? 0.5);
            slot.adjustParameter('damage', parameters.damageIncrease ?? 2);
            adjustChargePerUse(slot, parameters.chargeIncrease ?? 1);
            return true;
        },
    },
    precisionFocus: {
        synergy: { wants: ['energyWeapon'] },
        aiEvaluator: weaponModifierEvaluator('precisionFocus'),
        prime: (_gameState, _ship, slot, parameters) => {
            slot.adjustParameter('damage', parameters.damageIncrease ?? 2);
            slot.adjustParameter('accuracy', parameters.accuracyIncrease ?? 20);
            adjustChargePerUse(slot, parameters.chargeIncrease ?? 1);
            return true;
        },
    },
    subCritical: {
        synergy: { provides: ['weaponCharge'], wants: ['energyWeapon'] },
        aiEvaluator: weaponModifierEvaluator('subCritical', -10),
        prime: (_gameState, _ship, slot, parameters) => {
            scaleParameter(slot, 'damage', parameters.damageMultiplier ?? 75);
            adjustChargePerUse(slot, -(parameters.chargeReduction ?? 1));
            slot.adjustParameter('totalCharge', parameters.totalChargeIncrease ?? 4);
            return true;
        },
    },
    weaponOvercharge: {
        synergy: { wants: ['energyWeapon', 'weaponCharge'] },
        aiEvaluator: weaponModifierEvaluator('weaponOvercharge'),
        prime: (_gameState, _ship, slot, parameters) => {
            slot.adjustParameter('damage', parameters.damageIncrease ?? 4);
            adjustChargePerUse(slot, parameters.chargeIncrease ?? 2);
            slot.adjustParameter('totalCharge', parameters.totalChargeIncrease ?? 4);
            slot.adjustParameter('selfDamage', parameters.selfDamage ?? 2);
            return true;
        },
    },
    rapidFire: {
        synergy: { wants: ['energyWeapon', 'lock'] },
        aiEvaluator: weaponModifierEvaluator('rapidFire', 2),
        prime: (_gameState, _ship, slot, parameters) => {
            slot.adjustParameter('damage', -(parameters.damageReduction ?? 4));
            const current = slot.getParameter('chargePerUse');
            adjustChargePerUse(slot, Math.round(current * (parameters.chargeMultiplier ?? 350) / 100) - current);
            setTotalToOneUse(slot);
            slot.adjustParameter('extraShots', parameters.extraShots ?? 2);
            return true;
        },
    },
    ionicSurge: {
        synergy: { wants: ['energyWeapon'] },
        aiEvaluator: weaponModifierEvaluator('ionicSurge'),
        prime: (_gameState, _ship, slot, parameters) => {
            slot.adjustParameter('damage', -(parameters.damageReduction ?? 2));
            adjustChargePerUse(slot, parameters.chargeIncrease ?? 2);
            slot.card?.addTrait('dampening', ExtraTraitType.RemoveOnPlay);
            slot.card?.addTrait('draining', ExtraTraitType.RemoveOnPlay);
            return true;
        },
    },
    extendedUse: {
        synergy: { provides: ['weaponCharge'] },
        aiEvaluator: weaponModifierEvaluator('extendedUse'),
        prime: (_gameState, _ship, slot, parameters) => {
            slot.adjustParameter('totalCharge', parameters.totalChargeIncrease ?? 3);
            return true;
        },
    },
    efficiency: {
        synergy: { provides: ['weaponCharge'] },
        aiEvaluator: weaponModifierEvaluator('efficiency'),
        prime: (_gameState, _ship, slot, parameters) => {
            adjustChargePerUse(slot, -(parameters.chargeReduction ?? 1));
            return true;
        },
    },
    rechargeable: {
        aiEvaluator: weaponModifierEvaluator('rechargeable'),
        prime: (_gameState, _ship, slot) => {
            slot.card?.addTrait('rechargeable', ExtraTraitType.RemoveOnPlay);
            return true;
        },
    },
    acquireLock: {
        synergy: { provides: ['lock'] },
        aiEvaluator: (card, ctx) => {
            const targetId = ctx.blackboard.targetId;
            const target = targetId !== null && ctx.ship.knownObjects.has(targetId) ? ctx.gameState.objects.get(targetId) : undefined;
            const tactical = ctx.ship.tacticalState;
            // Not worth playing with no ship to lock, or with as much Lock on it as there can be.
            if (!targetId || !target || !isShip(target) || (tactical.lockTargetId === targetId && tactical.lockLevel >= maxLockLevel)) {
                return [];
            }

            return [{
                score: 35,
                cost: card.getParameter('cost'),
                action: { kind: 'playCard', cardId: card.id, cardType: 'acquireLock', targetType: 'enemy', targetId },
            }];
        },
        play: (_gameState, ship, target, _targetSystem, parameters) => {
            return !!target && ship.tacticalState.addLock(target, parameters.lockGain ?? 1);
        },
    },
    alphaStrike: {
        synergy: { wants: ['lock', 'weaponCharge'] },
        aiEvaluator: (card, ctx) => {
            const tactical = ctx.ship.tacticalState;
            const target = tactical.lockLevel > 0 && ctx.ship.knownObjects.has(tactical.lockTargetId) ? ctx.gameState.objects.get(tactical.lockTargetId) : undefined;
            if (!target) {
                return [];
            }

            // Worth it once the volley is more than a single ordinary shot: with two weapons to fire, or one and Lock built up.
            const solution = getFiringSolution(ctx.ship.motion, target.motion, ctx.currentTime);
            const ready = tactical.slots.filter(slot => getFiringState(solution, slot.hasBeenFullyCharged, slot.charge, slot.getParameters(), undefined, tactical.getAimedFor(slot, target.id)) === FiringState.CanFire).length;
            if (ready === 0 || (ready === 1 && tactical.lockLevel < 2)) {
                return [];
            }

            return [{
                score: 90,
                cost: card.getParameter('cost'),
                action: { kind: 'playCard', cardId: card.id, cardType: 'alphaStrike', targetType: 'no-target', targetId: '' },
            }];
        },
        play: (_gameState, ship, parameters) => {
            return ship.tacticalState.fireVolley(parameters.damagePerLock ?? 5) > 0;
        },
    },
    // No evaluators for these: the AI has no use for them.
    holdFire: {
        synergy: { provides: ['lock'] },
        play: (_gameState, ship) => ship.tacticalState.holdFire(),
    },
    calledShot: {
        synergy: { wants: ['lock'] },
        play: (_gameState, ship, parameters) => ship.tacticalState.callShot(parameters.lockCost ?? 3),
    },
    // No evaluators for these two: the AI doesn't play them, but still spends them as charge.
    powerCell: {
        synergy: { provides: ['weaponCharge'] },
        prime: (gameState, _ship, slot, parameters) => {
            if (!slot.canBeCharged()) {
                return false;
            }

            slot.addCharge(parameters.charge ?? 1, gameState.currentTime);
            return true;
        },
    },
    hotSwap: {
        synergy: { provides: ['weaponCharge'] },
        // The weapon it's played on takes all the other weapon's charge.
        prime: (_gameState, ship, slot) => {
            const source = ship.tacticalState.getOtherLoadedSlot(slot.id);
            return !!source && ship.tacticalState.moveCharge(source.id, slot.id);
        },
    },
    tractorBeam: {
        // It does no damage, so the AI rates it below its weapons that do. It fires it once, and only to set up another weapon's shot.
        aiEvaluator: weaponLoadEvaluator('tractorBeam', -10),
        synergy: { provides: ['lock'], wants: ['weaponCharge'] },
        load: (_gameState, _ship, _slot) => {
            return true;
        },
        // Firing takes hold of the target. With its drain, the weapon then stays active, and the hold with it, until it ends (see release).
        fire: (gameState, ship, target, parameters) => {
            if (!isShip(target) || !engageTractorBeam(ship, target, parameters.maxRange ?? 8, parameters.targetSlowdown ?? 60, parameters.ownSlowdown ?? 25)) {
                return false;
            }

            // Clients draw this as a beam from the ship to its target.
            gameState.broadcastWeaponEffect({
                type: 'shot',
                weapon: 'tractorBeam',
                sourceId: ship.id,
                targetId: target.id,
                targetPosition: getTargetPosition(target, gameState.currentTime),
                startTime: gameState.currentTime,
            });

            // A ship held steady is easy to lock onto.
            ship.tacticalState.addLock(target, parameters.lockGain ?? 1);
            return true;
        },
        // The weapon stops being active once the beam has broken, or been moved onto another ship.
        holds: (_gameState, ship, target) => isShip(target) && isHoldingInTractorBeam(ship, target),
        release: (_gameState, ship, target) => {
            if (target && isShip(target)) {
                releaseTractorBeam(ship, target);
            }
        },
    },
    steadyFire: {
        synergy: { wants: ['weaponCharge'] },
        aiEvaluator: weaponModifierEvaluator('steadyFire'),
        prime: (_gameState, _ship, slot, parameters) => {
            // The tactical system adds the accuracy as the weapon fires, up to the most.
            slot.adjustParameter('accuracyPerShot', parameters.accuracyPerShot ?? 5);
            slot.adjustParameter('maxStackedAccuracy', parameters.maxStackedAccuracy ?? 20);
            return true;
        },
    },
    // The AI doesn't play this or Tracer Round: it has no use for either.
    disablingShot: {
        prime: (_gameState, _ship, slot) => {
            slot.adjustParameter('sparesHull', 1);
            return true;
        },
    },
    tracerRound: {
        prime: (_gameState, _ship, slot) => {
            slot.adjustParameter('tracer', 1);
            return true;
        },
    },
    exploit: {
        // The AI doesn't aim at systems for the effects on them, so it rates this below its other modifiers.
        aiEvaluator: weaponModifierEvaluator('exploit', -20),
        prime: (_gameState, _ship, slot, parameters) => {
            // The tactical system adds this to an aimed shot's damage as the weapon fires.
            slot.adjustParameter('damagePerNegativeEffect', parameters.damagePerNegativeEffect ?? 6);
            return true;
        },
    },
    plasmaWarhead: {
        synergy: { wants: ['torpedoWeapon'] },
        aiEvaluator: weaponModifierEvaluator('plasmaWarhead'),
        prime: (_gameState, _ship, slot, parameters) => {
            slot.adjustParameter('damage', -(parameters.damageReduction ?? 10));
            slot.card?.addTrait('persistent', ExtraTraitType.RemoveOnPlay);
            return true;
        },
    },
    proximityFuse: {
        synergy: { wants: ['torpedoWeapon'] },
        aiEvaluator: weaponModifierEvaluator('proximityFuse'),
        prime: (_gameState, _ship, slot, parameters) => {
            slot.adjustParameter('accuracy', parameters.accuracyIncrease ?? 15);
            slot.card?.addTrait('area', ExtraTraitType.RemoveOnPlay);
            return true;
        },
    },
    phaseShift: {
        synergy: { wants: ['energyWeapon'] },
        aiEvaluator: weaponModifierEvaluator('phaseShift'),
        prime: (_gameState, _ship, slot, parameters) => {
            adjustChargePerUse(slot, parameters.chargeIncrease ?? 2);
            slot.card?.addTrait('penetrating', ExtraTraitType.RemoveOnPlay);
            return true;
        },
    },
});
