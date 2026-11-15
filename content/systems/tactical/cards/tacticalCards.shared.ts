import { defineCards } from 'common-data/content/SharedContent';
import { effects } from 'content/systems/tactical/effects/tacticalEffects.shared';

/** How long a flare burns, once the Flare card is played. */
export const flareDuration = 8000;

export const cards = defineCards({
    flare: {
        targetType: 'no-target',
        system: 'tactical',
        parameters: { cost: 2, duration: flareDuration / 1000 },
    },
    phaserCannon: {
        targetType: 'weapon-slot',
        system: 'tactical',
        traits: ['energyWeapon'],
        parameters: {
            cost: 3,
            chargePerUse: 2,
            totalCharge: 8,
            maxRange: 10,
            firingArc: 1,
            damage: 20,
        },
    },
    phaserStrip: {
        targetType: 'weapon-slot',
        system: 'tactical',
        traits: ['energyWeapon'],
        parameters: {
            cost: 2,
            chargePerUse: 3,
            totalCharge: 6,
            maxRange: 6,
            firingArc: 3,
            damage: 10,
        },
    },
    photonicCannon: {
        targetType: 'weapon-slot',
        system: 'tactical',
        traits: ['energyWeapon'],
        parameters: {
            cost: 5,
            chargePerUse: 8,
            totalCharge: 10,
            maxRange: 15,
            firingArc: 0.5,
            damage: 60,
        },
    },
    photonTorpedo: {
        targetType: 'weapon-slot',
        system: 'tactical',
        traits: ['torpedoWeapon'],
        parameters: {
            cost: 3,
            chargePerUse: 4,
            totalCharge: 4,
            maxRange: 20,
            firingArc: 0.5,
            damage: 40,
        },
    },
    quantumTorpedo: {
        targetType: 'weapon-slot',
        system: 'tactical',
        traits: ['torpedoWeapon'],
        parameters: {
            cost: 4,
            chargePerUse: 6,
            totalCharge: 8,
            maxRange: 15,
            firingArc: 0.5,
            damage: 60,
        },
    },
    lowYield: {
        targetType: 'weapon',
        system: 'tactical',
        requiredWeaponTrait: 'torpedoWeapon',
        parameters: { cost: 1, damageReduction: 6, chargeReduction: 2 },
    },
    highYield: {
        targetType: 'weapon',
        system: 'tactical',
        requiredWeaponTrait: 'torpedoWeapon',
        parameters: { cost: 3, damageIncrease: 12, chargeIncrease: 2 },
    },
    extendedRange: {
        targetType: 'weapon',
        system: 'tactical',
        requiredWeaponTrait: 'torpedoWeapon',
        parameters: { cost: 2, damageReduction: 2, maxRangeIncrease: 5, minRangeIncrease: 2 },
    },
    projectileManoeuvrability: {
        targetType: 'weapon',
        system: 'tactical',
        requiredWeaponTrait: 'torpedoWeapon',
        parameters: { cost: 3, chargeIncrease: 1, firingArcIncrease: 0.5, accuracyIncrease: 20 },
    },
    fullSpread: {
        targetType: 'weapon',
        system: 'tactical',
        requiredWeaponTrait: 'torpedoWeapon',
        parameters: { cost: 4, damageReduction: 4, chargeMultiplier: 250, accuracyReduction: 15, extraShots: 2 },
    },
    highIntensity: {
        targetType: 'weapon',
        system: 'tactical',
        requiredWeaponTrait: 'energyWeapon',
        parameters: { cost: 2, damageIncrease: 4, firingArcReduction: 0.25, chargeIncrease: 1 },
    },
    lensingEnhancement: {
        targetType: 'weapon',
        system: 'tactical',
        requiredWeaponTrait: 'energyWeapon',
        parameters: { cost: 3, firingArcIncrease: 0.5, damageIncrease: 2, chargeIncrease: 1 },
    },
    precisionFocus: {
        targetType: 'weapon',
        system: 'tactical',
        requiredWeaponTrait: 'energyWeapon',
        parameters: { cost: 3, damageIncrease: 2, accuracyIncrease: 20, chargeIncrease: 1 },
    },
    subCritical: {
        targetType: 'weapon',
        system: 'tactical',
        requiredWeaponTrait: 'energyWeapon',
        parameters: { cost: 2, damageMultiplier: 75, chargeReduction: 1, totalChargeIncrease: 4 },
    },
    weaponOvercharge: {
        targetType: 'weapon',
        system: 'tactical',
        requiredWeaponTrait: 'energyWeapon',
        parameters: { cost: 4, damageIncrease: 4, chargeIncrease: 2, totalChargeIncrease: 4, selfDamage: 2 },
    },
    rapidFire: {
        targetType: 'weapon',
        system: 'tactical',
        requiredWeaponTrait: 'energyWeapon',
        parameters: { cost: 4, damageReduction: 3, chargeMultiplier: 350, extraShots: 5 },
    },
    ionicSurge: {
        targetType: 'weapon',
        system: 'tactical',
        requiredWeaponTrait: 'energyWeapon',
        traits: ['dampening', 'draining'],
        parameters: { cost: 4, damageReduction: 2, chargeIncrease: 2 },
    },
    extendedUse: {
        targetType: 'weapon',
        system: 'tactical',
        parameters: { cost: 1, totalChargeIncrease: 3 },
    },
    efficiency: {
        targetType: 'weapon',
        system: 'tactical',
        parameters: { cost: 2, chargeReduction: 1 },
    },
    rechargeable: {
        targetType: 'weapon',
        system: 'tactical',
        parameters: { cost: 2 },
    },
    acquireLock: {
        targetType: 'enemy',
        system: 'tactical',
        parameters: { cost: 1, lockGain: 1, accuracyPerLevel: 10, fadeSeconds: 8 },
    },
    alphaStrike: {
        targetType: 'no-target',
        system: 'tactical',
        parameters: { cost: 3, damagePerLock: 5 },
    },
    powerCell: {
        targetType: 'weapon',
        system: 'tactical',
        instant: true,
        parameters: { cost: 1, charge: 1, chargeValue: 5 },
    },
    hotSwap: {
        targetType: 'weapon',
        system: 'tactical',
        instant: true,
        parameters: { cost: 1 },
    },
    tractorBeam: {
        targetType: 'enemy',
        system: 'tactical',
        parameters: {
            cost: 3,
            duration: effects.heldByTractorBeam.duration / 1000,
            range: 8,
            targetSlowdown: 60,
            ownSlowdown: 25,
            lockGain: 1,
        },
    },
    exploit: {
        targetType: 'weapon',
        system: 'tactical',
        parameters: { cost: 2, damagePerNegativeEffect: 6 },
    },
    exampleEnemyTarget: {
        targetType: 'enemy',
        system: 'tactical',
        parameters: { cost: 3 },
    },
});
