import { systemEffectDefinitions } from '../../../features/ships/utils/systemEffectDefinitions';
import { CardDefinition, CardMotionSegmentFacing } from '../types/CardDefinition';
import { CardTargetType } from '../types/CardTargetType';

// Enforce that values are of a card definition type, without widening the key type to "string".
// The self-referential constraint ensures choice cards can only reference keys from this same object.
function defineCardDefinitions<T extends Record<string, CardDefinition<Extract<keyof T, string>>>>(defs: T) {
    return defs;
}

export const cardDefinitions = defineCardDefinitions({
    reactorPowerHull: {
        targetType: 'no-target',
        system: 'reactor',
        parameters: { cost: 0 },
    },
    reactorPowerReactor: {
        targetType: 'no-target',
        system: 'reactor',
        parameters: { cost: 0 },
    },
    reactorPowerHelm: {
        targetType: 'no-target',
        system: 'reactor',
        parameters: { cost: 0 },
    },
    reactorPowerScience: {
        targetType: 'no-target',
        system: 'reactor',
        parameters: { cost: 0 },
    },
    reactorPowerTactical: {
        targetType: 'no-target',
        system: 'reactor',
        parameters: { cost: 0 },
    },
    reactorPowerEngineer: {
        targetType: 'no-target',
        system: 'reactor',
        parameters: { cost: 0 },
    },
    flare: {
        targetType: 'no-target',
        system: 'tactical',
        parameters: { cost: 2 },
    },
    smokeScreen: {
        targetType: 'no-target',
        system: 'engineer',
        parameters: { cost: 3 },
    },
    phaserCannon: {
        targetType: 'weapon-slot',
        system: 'tactical',
        traits: ['energyWeapon'],
        parameters: {
            cost: 2,
            chargeCost: 5,
            maxRange: 10,
            firingArc: 1,
            damage: 20,
            uses: 3,
        },
    },
    phaserStrip: {
        targetType: 'weapon-slot',
        system: 'tactical',
        traits: ['energyWeapon'],
        parameters: {
            cost: 4,
            chargeCost: 3,
            maxRange: 6,
            firingArc: 3,
            damage: 10,
            uses: 5,
        },
    },
    photonTorpedo: {
        targetType: 'weapon-slot',
        system: 'tactical',
        traits: ['torpedoWeapon'],
        parameters: {
            cost: 3,
            chargeCost: 4,
            maxRange: 20,
            firingArc: 0.5,
            damage: 40,
            uses: 1,
        },
    },
    photonicCannon: {
        targetType: 'weapon-slot',
        system: 'tactical',
        traits: ['energyWeapon'],
        parameters: {
            cost: 5,
            chargeCost: 6,
            maxRange: 15,
            firingArc: 0.5,
            damage: 60,
            uses: 2,
        },
    },
    lowYield: {
        targetType: 'weapon',
        system: 'tactical',
        requiredWeaponTrait: 'torpedoWeapon',
        parameters: { cost: 1, damageReduction: 5, chargeReduction: 2 },
    },
    fullSpread: {
        targetType: 'weapon',
        system: 'tactical',
        requiredWeaponTrait: 'torpedoWeapon',
        parameters: { cost: 2, damageMultiplier: 175, chargeIncrease: 3 },
    },
    subCritical: {
        targetType: 'weapon',
        system: 'tactical',
        requiredWeaponTrait: 'energyWeapon',
        parameters: { cost: 2, damageMultiplier: 75, chargeReduction: 1, extraUses: 2 },
    },
    weaponOvercharge: {
        targetType: 'weapon',
        system: 'tactical',
        requiredWeaponTrait: 'energyWeapon',
        parameters: { cost: 4, charge: 2, chargeIncrease: 3, damageIncrease: 3, fewerUses: 2, selfDamage: 2 },
    },
    chargeX: {
        targetType: 'weapon',
        system: 'tactical',
        parameters: { cost: 1 },
    },
    ionicSurge: {
        targetType: 'weapon',
        system: 'tactical',
        requiredWeaponTrait: 'energyWeapon',
        traits: ['dampening', 'disabling'],
        parameters: { cost: 4, chargeIncrease: 2, fewerUses: 1 },
    },
    exampleEnemyTarget: {
        targetType: 'enemy',
        system: 'tactical',
        parameters: { cost: 3 },
    },
    slowAndSteady: {
        targetType: 'location',
        system: 'helm',
        traits: ['primary'],
        // Rotate to face target first, then move straight towards it
        startFacing: CardMotionSegmentFacing.FinalVector,
        endFacing: CardMotionSegmentFacing.FinalVector,
        baseRotationSpeed: 0.75,
        baseSpeed: 0.75,
        parameters: { cost: 1, evasion: 0 },
    },
    fullReverse: {
        targetType: 'location',
        system: 'helm',
        // Rotate to face away from target, then reverse towards it
        startFacing: CardMotionSegmentFacing.FinalVector,
        startFacingOffset: Math.PI,
        endFacing: CardMotionSegmentFacing.FinalVector,
        endFacingOffset: Math.PI,
        baseRotationSpeed: 0.75,
        baseSpeed: 0.5,
        parameters: { cost: 2, evasion: 0 },
    },
    zigZag: {
        targetType: 'location',
        system: 'helm',
        // Rotate to face target first, then zig-zag towards it
        startFacing: CardMotionSegmentFacing.FinalVector,
        endFacing: CardMotionSegmentFacing.FinalVector,
        baseRotationSpeed: 1.25,
        baseSpeed: 1,
        perpendicularPositionOffsets: [-0.15, 0.25, -0.25, 0.15],
        minDistance: 3,
        parameters: { cost: 2, evasion: 25 },
    },
    strafe: {
        targetType: 'location',
        system: 'helm',
        // Don't rotate before moving, keep current heading throughout
        baseRotationSpeed: 1,
        baseSpeed: 0.4,
        maxDistance: 4,
        parameters: { cost: 1, evasion: 15 },
    },
    sweep: {
        targetType: 'choice',
        system: 'helm',
        cards: ['sweepLeft', 'sweepRight'],
        parameters: { cost: 2 },
    },
    sweepLeft: {
        targetType: 'location',
        system: 'helm',
        startFacing: CardMotionSegmentFacing.FinalVector,
        startFacingOffset: -Math.PI / 4, // Start facing 45 degrees left of destination
        endFacing: CardMotionSegmentFacing.FinalVector,
        endFacingOffset: Math.PI / 4, // End facing 45 degrees right of destination
        baseRotationSpeed: 1,
        baseSpeed: 1,
        // Sine curve bulging right (positive = right of movement direction)
        perpendicularPositionOffsets: [0.14, 0.26, 0.35, 0.39, 0.39, 0.35, 0.26, 0.14],
        parameters: { cost: 2, evasion: 15 },
    },
    sweepRight: {
        targetType: 'location',
        system: 'helm',
        startFacing: CardMotionSegmentFacing.FinalVector,
        startFacingOffset: Math.PI / 4, // Start facing 45 degrees right of destination
        endFacing: CardMotionSegmentFacing.FinalVector,
        endFacingOffset: -Math.PI / 4, // End facing 45 degrees left of destination
        baseRotationSpeed: 1,
        baseSpeed: 1,
        // Sine curve bulging left (negative = left of movement direction)
        perpendicularPositionOffsets: [-0.14, -0.26, -0.35, -0.39, -0.39, -0.35, -0.26, -0.14],
        parameters: { cost: 2, evasion: 15 },
    },
    faceTarget: {
        targetType: 'location',
        system: 'helm',
        // Rotate to face the target, no movement
        startFacing: CardMotionSegmentFacing.FinalVector,
        baseRotationSpeed: 1,
        baseSpeed: 0,
        parameters: { cost: 1, evasion: 0 },
    },
    exampleNoTarget: {
        targetType: 'no-target',
        system: 'science',
        parameters: { cost: 2 },
    },
    auxPower: {
        targetType: 'system',
        system: 'engineer',
        traits: ['expendable'],
        parameters: { cost: 1, powerGain: 1 },
    },
    swapSystems: {
        targetType: 'choice',
        system: 'engineer',
        cards: ['swapHorizontal', 'swapUp', 'swapDown'],
        parameters: { cost: 3 },
    },
    swapHorizontal: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3 },
    },
    swapUp: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3 },
    },
    swapDown: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3 },
    },
    purge: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3 },
    },
    reset: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 4, duration: 3 },
    },
    focusShields: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 1, shieldBoost: 50, shieldReduction: 10 },
    },
    relocateSystem: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 5 },
    },
    relocateHere: {
        targetType: 'system',
        system: 'engineer',
        traits: ['expendable'],
        parameters: { cost: 1 },
    },
    sustain: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 2 },
    },
    distributePower: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3, powerChange: 1, duration: 30 },
    },
    drawPower: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3, powerChange: 1, duration: 30 },
    },
    divertAllPower: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 4, lossPerSystem: 1, duration: 20, targetGain: 5 },
    },
    divertSystemPower: {
        targetType: 'choice',
        system: 'engineer',
        cards: ['divertHelm', 'divertScience', 'divertTactical'],
        parameters: { cost: 3 },
    },
    divertHelm: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3, maxAmount: 3, duration: 20 },
    },
    divertScience: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3, maxAmount: 3, duration: 20 },
    },
    divertTactical: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3, maxAmount: 3, duration: 20 },
    },
    overcharge: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 2, powerGain: 3, duration: 15 },
    },
    shunt: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3 },
    },
    generationPriority: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 2, duration: 60 },
    },
    passiveScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 1,
        },
    },
    antiprotonScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 2,
            effectLevel: 25,
            duration: systemEffectDefinitions.antiprotonResidue.duration,
        },
        deflectorSubstance: 'Antiproton',
    },
    tetryonScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 2,
            duration: systemEffectDefinitions.tetryonAccumulation.duration,
        },
        deflectorSubstance: 'Tetryon',
    },
    chronitonScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 2,
            effectLevel: 1,
            duration: systemEffectDefinitions.chronitonSaturation.duration,
        },
        deflectorSubstance: 'Chroniton',
    },
    polaronScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 2,
            effectLevel: 1,
            duration: systemEffectDefinitions.polaronBombardment.duration,
        },
        deflectorSubstance: 'Polaron',
    },
    invertedPulseScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 3,
        },
        deflectorModifier: 'Inverted',
        deflectorDelivery: 'Pulse',
    },
    coherentBeamScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 3,
        },
        deflectorModifier: 'Coherent',
        deflectorDelivery: 'Beam',
    },
    phasedBurstScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 3,
        },
        deflectorModifier: 'Phased',
        deflectorDelivery: 'Burst',
    },
    phasedPolaronScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 3,
            duration: 6,
        },
        deflectorModifier: 'Phased',
        deflectorSubstance: 'Polaron',
    },
    coherentTetryonScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 3,
        },
        deflectorModifier: 'Coherent',
        deflectorSubstance: 'Tetryon',
    },
    coherentChronitonScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 4,
        },
        deflectorModifier: 'Coherent',
        deflectorSubstance: 'Chroniton',
        deflectorDelivery: 'Beam',
    },
    invertedAntiprotonScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 3,
            effectLevel: 15,
            duration: systemEffectDefinitions.antiprotonResidue.duration,
        },
        deflectorModifier: 'Inverted',
        deflectorSubstance: 'Antiproton',
    },
    invertedChronitonScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 3,
        },
        deflectorModifier: 'Inverted',
        deflectorSubstance: 'Chroniton',
    },
    deflectorPhasedAntiprotonBeam: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedAntiprotonPulse: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedAntiprotonBurst: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedAntiprotonField: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorPhasedTetryonBeam: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedTetryonPulse: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedTetryonBurst: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedTetryonField: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorPhasedChronitonBeam: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedChronitonPulse: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedChronitonBurst: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedChronitonField: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorPhasedGravitonBeam: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorPhasedGravitonPulse: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorPhasedGravitonBurst: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorPhasedGravitonField: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 3 },
    },
    deflectorPhasedPolaronBeam: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedPolaronPulse: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedPolaronBurst: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedPolaronField: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorCoherentAntiprotonBeam: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentAntiprotonPulse: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentAntiprotonBurst: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentAntiprotonField: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorCoherentTetryonBeam: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentTetryonPulse: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentTetryonBurst: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentTetryonField: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorCoherentChronitonBeam: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentChronitonPulse: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentChronitonBurst: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentChronitonField: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorCoherentGravitonBeam: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorCoherentGravitonPulse: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorCoherentGravitonBurst: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorCoherentGravitonField: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 3 },
    },
    deflectorCoherentPolaronBeam: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentPolaronPulse: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentPolaronBurst: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentPolaronField: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorInvertedAntiprotonBeam: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedAntiprotonPulse: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedAntiprotonBurst: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedAntiprotonField: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorInvertedTetryonBeam: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedTetryonPulse: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedTetryonBurst: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedTetryonField: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorInvertedChronitonBeam: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedChronitonPulse: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedChronitonBurst: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedChronitonField: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorInvertedGravitonBeam: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorInvertedGravitonPulse: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorInvertedGravitonBurst: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorInvertedGravitonField: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 3 },
    },
    deflectorInvertedPolaronBeam: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedPolaronPulse: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedPolaronBurst: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedPolaronField: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedAntiprotonBeam: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedAntiprotonPulse: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedAntiprotonBurst: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedAntiprotonField: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 3 },
    },
    deflectorModulatedTetryonBeam: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedTetryonPulse: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedTetryonBurst: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedTetryonField: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 3 },
    },
    deflectorModulatedChronitonBeam: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedChronitonPulse: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedChronitonBurst: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedChronitonField: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 3 },
    },
    deflectorModulatedGravitonBeam: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 3 },
    },
    deflectorModulatedGravitonPulse: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 3 },
    },
    deflectorModulatedGravitonBurst: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 3 },
    },
    deflectorModulatedGravitonField: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 2 },
    },
    deflectorModulatedPolaronBeam: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedPolaronPulse: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedPolaronBurst: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedPolaronField: {
        targetType: 'enemy',
        system: 'science',
        traits: ['expendable'],
        parameters: { cost: 3 },
    },
    hullChargeShields: {
        targetType: 'no-target',
        system: 'hull',
        parameters: { cost: 0 },
    },
} as const);

export type CardType = keyof typeof cardDefinitions;

type KeysWithTargetType<TRecord, TKey extends CardTargetType> = {
    [K in keyof TRecord]: TRecord[K] extends { targetType: TKey } ? K : never
}[keyof TRecord];

export type UntargetedCardType = KeysWithTargetType<typeof cardDefinitions, 'no-target'>;

export type WeaponSlotTargetedCardType = KeysWithTargetType<typeof cardDefinitions, 'weapon-slot'>;

export type WeaponTargetedCardType = KeysWithTargetType<typeof cardDefinitions, 'weapon'>;

export type SystemSlotTargetedCardType = KeysWithTargetType<typeof cardDefinitions, 'system'>;

export type EnemyTargetedCardType = KeysWithTargetType<typeof cardDefinitions, 'enemy'>;

export type ScanTargetedCardType = KeysWithTargetType<typeof cardDefinitions, 'scan'>;

export type LocationTargetedCardType = KeysWithTargetType<typeof cardDefinitions, 'location'>;

export type ChoiceCardType = KeysWithTargetType<typeof cardDefinitions, 'choice'>;
