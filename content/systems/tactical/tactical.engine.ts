import { WeaponTrait } from 'common-data/features/cards/types/CardTrait';
import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { projectileFlightTime } from 'common-data/features/space/types/WeaponEffect';
import { weaponLoadEvaluator, weaponModifierEvaluator } from 'engine/ai/evaluators/tactical';
import { defineEngineContent } from 'engine/content/EngineContent';
import { GameObject } from 'engine/state/GameObject';
import { tacticalShared } from './tactical.shared';
import type { IRandom } from 'common-data/types/IRandom';
import type { GameState } from 'engine/state/GameState';
import type { Ship } from 'engine/state/Ship';
import type { WeaponSlotState } from 'engine/state/systems/tactical/WeaponSlotState';

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
 * Fire a weapon at a target, telling clients to show that. Whether it will hit is settled now, but any damage lands when the shot arrives.
 * A target that's gone by then takes no damage: the shot just carries on to where it was.
 */
function fireShot(
    gameState: GameState,
    ship: Ship,
    target: GameObject | null,
    weapon: string,
    accuracy: number,
    damageAmount: number | null | undefined,
    traits: WeaponTrait[],
    targetSystem: ShipSystem | null,
    flightTime = 0
) {
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
        const damage = target.damage({
            amount: damageAmount,
            traits,
            targetSystem: targetSystem ?? undefined,
            sourceId: ship.id,
        });

        if (isShip(target)) {
            gameState.broadcastWeaponEffect({
                type: 'impact',
                sourceId: ship.id,
                targetId: target.id,
                damage,
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

export const tacticalEngine = defineEngineContent({
    shared: tacticalShared,
    cards: {
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
            aiEvaluator: weaponLoadEvaluator('phaserCannon'),
            load: (_gameState, _ship, _slot) => {
                return true;
            },
            fire: (gameState, ship, target, parameters, accuracy, weaponTraits, targetSystem) => {
                fireShot(gameState, ship, target, 'phaserCannon', accuracy, parameters.damage, weaponTraits, targetSystem);
                return true;
            },
        },
        phaserStrip: {
            aiEvaluator: weaponLoadEvaluator('phaserStrip'),
            load: (_gameState, _ship, _slot) => {
                return true;
            },
            fire: (gameState, ship, target, parameters, accuracy, weaponTraits, targetSystem) => {
                fireShot(gameState, ship, target, 'phaserStrip', accuracy, parameters.damage, weaponTraits, targetSystem);
                return true;
            },
        },
        photonicCannon: {
            aiEvaluator: weaponLoadEvaluator('photonicCannon'),
            load: (_gameState, _ship, _slot) => {
                return true;
            },
            fire: (gameState, ship, target, parameters, accuracy, weaponTraits, targetSystem) => {
                fireShot(gameState, ship, target, 'photonicCannon', accuracy, parameters.damage, weaponTraits, targetSystem);
                return true;
            },
        },
        photonTorpedo: {
            aiEvaluator: weaponLoadEvaluator('photonTorpedo'),
            load: (_gameState, _ship, _slot) => {
                return true;
            },
            fire: (gameState, ship, target, parameters, accuracy, weaponTraits, targetSystem) => {
                fireShot(gameState, ship, target, 'photonTorpedo', accuracy, parameters.damage, weaponTraits, targetSystem, projectileFlightTime);
                return true;
            },
        },
        quantumTorpedo: {
            aiEvaluator: weaponLoadEvaluator('quantumTorpedo'),
            load: (_gameState, _ship, _slot) => {
                return true;
            },
            fire: (gameState, ship, target, parameters, accuracy, weaponTraits, targetSystem) => {
                fireShot(gameState, ship, target, 'quantumTorpedo', accuracy, parameters.damage, weaponTraits, targetSystem, projectileFlightTime);
                return true;
            },
        },
        lowYield: {
            aiEvaluator: weaponModifierEvaluator('lowYield'),
            prime: (_gameState, _ship, slot, parameters) => {
                slot.adjustParameter('damage', -(parameters.damageReduction ?? 6));
                adjustChargePerUse(slot, -(parameters.chargeReduction ?? 2));
                setTotalToOneUse(slot);
                return true;
            },
        },
        highYield: {
            aiEvaluator: weaponModifierEvaluator('highYield'),
            prime: (_gameState, _ship, slot, parameters) => {
                slot.adjustParameter('damage', parameters.damageIncrease ?? 12);
                adjustChargePerUse(slot, parameters.chargeIncrease ?? 2);
                setTotalToOneUse(slot);
                return true;
            },
        },
        extendedRange: {
            aiEvaluator: weaponModifierEvaluator('extendedRange'),
            prime: (_gameState, _ship, slot, parameters) => {
                slot.adjustParameter('damage', -(parameters.damageReduction ?? 2));
                slot.adjustParameter('maxRange', parameters.maxRangeIncrease ?? 5);
                slot.adjustParameter('minRange', parameters.minRangeIncrease ?? 2);
                return true;
            },
        },
        projectileManoeuvrability: {
            aiEvaluator: weaponModifierEvaluator('projectileManoeuvrability'),
            prime: (_gameState, _ship, slot, parameters) => {
                adjustChargePerUse(slot, parameters.chargeIncrease ?? 1);
                slot.adjustParameter('firingArc', parameters.firingArcIncrease ?? 0.5);
                slot.adjustParameter('accuracy', parameters.accuracyIncrease ?? 20);
                return true;
            },
        },
        fullSpread: {
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
            aiEvaluator: weaponModifierEvaluator('lensingEnhancement'),
            prime: (_gameState, _ship, slot, parameters) => {
                slot.adjustParameter('firingArc', parameters.firingArcIncrease ?? 0.5);
                slot.adjustParameter('damage', parameters.damageIncrease ?? 2);
                adjustChargePerUse(slot, parameters.chargeIncrease ?? 1);
                return true;
            },
        },
        precisionFocus: {
            aiEvaluator: weaponModifierEvaluator('precisionFocus'),
            prime: (_gameState, _ship, slot, parameters) => {
                slot.adjustParameter('damage', parameters.damageIncrease ?? 2);
                slot.adjustParameter('accuracy', parameters.accuracyIncrease ?? 20);
                adjustChargePerUse(slot, parameters.chargeIncrease ?? 1);
                return true;
            },
        },
        subCritical: {
            aiEvaluator: weaponModifierEvaluator('subCritical', -10),
            prime: (_gameState, _ship, slot, parameters) => {
                scaleParameter(slot, 'damage', parameters.damageMultiplier ?? 75);
                adjustChargePerUse(slot, -(parameters.chargeReduction ?? 1));
                slot.adjustParameter('totalCharge', parameters.totalChargeIncrease ?? 4);
                return true;
            },
        },
        weaponOvercharge: {
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
            aiEvaluator: weaponModifierEvaluator('extendedUse'),
            prime: (_gameState, _ship, slot, parameters) => {
                slot.adjustParameter('totalCharge', parameters.totalChargeIncrease ?? 3);
                return true;
            },
        },
        efficiency: {
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
        exampleEnemyTarget: {
            play: (_gameState, _ship, _target) => {
                console.log('played exampleEnemyTarget'); return true;
            },
        },
    },
    effects: {
        // Nothing to do here: an encounter that cares whether a flare is burning looks for this on a ship's tactical system.
        flareBurning: {
            apply: system => system.system === 'tactical',
            remove: () => {},
        },
    },
});
