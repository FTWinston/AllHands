import { CardDefinition, CardMotionSegmentFacing } from '../types/CardDefinition';
import { CardTargetType } from '../types/CardTargetType';

// Enforce that values are of a card definition type, without widening the key type to "string".
// The self-referential constraint ensures choice cards can only reference keys from this same object.
function defineCardDefinitions<T extends Record<string, CardDefinition<Extract<keyof T, string>>>>(defs: T) {
    return defs;
}

export const cardDefinitions = defineCardDefinitions({
    flare: {
        targetType: 'no-target',
        crew: 'tactical',
        parameters: { cost: 2 },
    },
    smokeScreen: {
        targetType: 'no-target',
        crew: 'engineer',
        parameters: { cost: 3 },
    },
    phaserCannon: {
        targetType: 'weapon-slot',
        crew: 'tactical',
        damageType: 'coherent',
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
        crew: 'tactical',
        damageType: 'coherent',
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
        crew: 'tactical',
        damageType: 'antimatter',
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
        crew: 'tactical',
        damageType: 'coherent',
        parameters: {
            cost: 5,
            chargeCost: 6,
            maxRange: 15,
            firingArc: 0.5,
            damage: 60,
            uses: 2,
        },
    },

    quickCharge: {
        targetType: 'weapon',
        crew: 'tactical',
        parameters: { cost: 1, damageReduction: 5, chargeReduction: 2 },
    },
    heavyCharge: {
        targetType: 'weapon',
        crew: 'tactical',
        parameters: { cost: 2, damageIncrease: 10, chargeIncrease: 2 },
    },
    extraAmmo: {
        targetType: 'weapon',
        crew: 'tactical',
        parameters: { cost: 2, extraUses: 1 },
    },
    chargeX: {
        targetType: 'weapon',
        crew: 'tactical',
        parameters: { cost: 1 },
    },
    weaponOvercharge: {
        targetType: 'weapon',
        crew: 'tactical',
        parameters: { cost: 4, charge: 2, capacityIncrease: 3, damageMultiplier: 50 },
    },
    ionicSurge: {
        targetType: 'weapon',
        crew: 'tactical',
        parameters: { cost: 3, charge: 1, damageMultiplier: 50 },
    },
    adaptWeapon: {
        targetType: 'choice',
        crew: 'tactical',
        cards: ['ionConversion', 'plasmaConversion', 'disruptorConversion'],
        parameters: { cost: 3 },
    },
    ionConversion: {
        targetType: 'weapon',
        crew: 'tactical',
        parameters: { cost: 3 },
    },
    plasmaConversion: {
        targetType: 'weapon',
        crew: 'tactical',
        parameters: { cost: 3 },
    },
    disruptorConversion: {
        targetType: 'weapon',
        crew: 'tactical',
        parameters: { cost: 3 },
    },
    exampleEnemyTarget: {
        targetType: 'enemy',
        crew: 'tactical',
        parameters: { cost: 3 },
    },
    slowAndSteady: {
        targetType: 'location',
        crew: 'helm',
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
        crew: 'helm',
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
        crew: 'helm',
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
        crew: 'helm',
        // Don't rotate before moving, keep current heading throughout
        baseRotationSpeed: 1,
        baseSpeed: 0.4,
        maxDistance: 4,
        parameters: { cost: 1, evasion: 15 },
    },
    sweep: {
        targetType: 'choice',
        crew: 'helm',
        cards: ['sweepLeft', 'sweepRight'],
        parameters: { cost: 2 },
    },
    sweepLeft: {
        targetType: 'location',
        crew: 'helm',
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
        crew: 'helm',
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
        crew: 'helm',
        // Rotate to face the target, no movement
        startFacing: CardMotionSegmentFacing.FinalVector,
        baseRotationSpeed: 1,
        baseSpeed: 0,
        parameters: { cost: 1, evasion: 0 },
    },
    exampleNoTarget: {
        targetType: 'no-target',
        crew: 'science',
        parameters: { cost: 2 },
    },
    auxPower: {
        targetType: 'system',
        crew: 'engineer',
        traits: ['expendable'],
        parameters: { cost: 1, powerGain: 1 },
    },
    swapSystems: {
        targetType: 'choice',
        crew: 'engineer',
        cards: ['swapHorizontal', 'swapUp', 'swapDown'],
        parameters: { cost: 3 },
    },
    swapHorizontal: {
        targetType: 'system',
        crew: 'engineer',
        parameters: { cost: 3 },
    },
    swapUp: {
        targetType: 'system',
        crew: 'engineer',
        parameters: { cost: 3 },
    },
    swapDown: {
        targetType: 'system',
        crew: 'engineer',
        parameters: { cost: 3 },
    },
    purge: {
        targetType: 'system',
        crew: 'engineer',
        parameters: { cost: 3 },
    },
    reset: {
        targetType: 'system',
        crew: 'engineer',
        parameters: { cost: 4, duration: 3 },
    },
    focusShields: {
        targetType: 'system',
        crew: 'engineer',
        parameters: { cost: 1, shieldBoost: 50, shieldReduction: 10 },
    },
    relocateSystem: {
        targetType: 'system',
        crew: 'engineer',
        parameters: { cost: 5 },
    },
    relocateHere: {
        targetType: 'system',
        crew: 'engineer',
        traits: ['expendable'],
        parameters: { cost: 1 },
    },
    sustain: {
        targetType: 'system',
        crew: 'engineer',
        parameters: { cost: 2 },
    },
    distributePower: {
        targetType: 'system',
        crew: 'engineer',
        parameters: { cost: 3, powerChange: 1, duration: 30 },
    },
    drawPower: {
        targetType: 'system',
        crew: 'engineer',
        parameters: { cost: 3, powerChange: 1, duration: 30 },
    },
    divertAllPower: {
        targetType: 'system',
        crew: 'engineer',
        parameters: { cost: 4, lossPerSystem: 1, duration: 20, targetGain: 5 },
    },
    divertSystemPower: {
        targetType: 'choice',
        crew: 'engineer',
        cards: ['divertHelm', 'divertScience', 'divertTactical'],
        parameters: { cost: 3 },
    },
    divertHelm: {
        targetType: 'system',
        crew: 'engineer',
        parameters: { cost: 3, maxAmount: 3, duration: 20 },
    },
    divertScience: {
        targetType: 'system',
        crew: 'engineer',
        parameters: { cost: 3, maxAmount: 3, duration: 20 },
    },
    divertTactical: {
        targetType: 'system',
        crew: 'engineer',
        parameters: { cost: 3, maxAmount: 3, duration: 20 },
    },
    overcharge: {
        targetType: 'system',
        crew: 'engineer',
        parameters: { cost: 2, powerGain: 3, duration: 15 },
    },
    shunt: {
        targetType: 'system',
        crew: 'engineer',
        parameters: { cost: 3 },
    },
    generationPriority: {
        targetType: 'system',
        crew: 'engineer',
        parameters: { cost: 2, duration: 60 },
    },
    scan: {
        targetType: 'deflector',
        crew: 'science',
        parameters: {
            cost: 1,
            duration: 30,
        },
        delivery: 'Beam',
    },
    scanPulse: {
        targetType: 'deflector',
        crew: 'science',
        parameters: {
            cost: 1,
        },
        delivery: 'Pulse',
    },
    tetryonScan: {
        targetType: 'deflector',
        crew: 'science',
        parameters: {
            cost: 2,
        },
        modifier: 'Coherent',
        substance: 'Tetryon',
    },
    phasedPolaronBeamScan: {
        targetType: 'deflector',
        crew: 'science',
        parameters: {
            cost: 3,
        },
        modifier: 'Phased',
        substance: 'Polaron',
        delivery: 'Beam',
    },
    deflectorPhasedAntiprotonBeam: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedAntiprotonPulse: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedAntiprotonBurst: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedAntiprotonWave: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorPhasedTetryonBeam: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedTetryonPulse: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedTetryonBurst: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedTetryonWave: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorPhasedChronitonBeam: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedChronitonPulse: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedChronitonBurst: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedChronitonWave: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorPhasedGravitonBeam: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorPhasedGravitonPulse: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorPhasedGravitonBurst: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorPhasedGravitonWave: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 3 },
    },
    deflectorPhasedPolaronBeam: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedPolaronPulse: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedPolaronBurst: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorPhasedPolaronWave: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorCoherentAntiprotonBeam: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentAntiprotonPulse: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentAntiprotonBurst: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentAntiprotonWave: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorCoherentTetryonBeam: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentTetryonPulse: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentTetryonBurst: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentTetryonWave: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorCoherentChronitonBeam: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentChronitonPulse: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentChronitonBurst: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentChronitonWave: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorCoherentGravitonBeam: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorCoherentGravitonPulse: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorCoherentGravitonBurst: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorCoherentGravitonWave: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 3 },
    },
    deflectorCoherentPolaronBeam: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentPolaronPulse: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentPolaronBurst: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorCoherentPolaronWave: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorInvertedAntiprotonBeam: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedAntiprotonPulse: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedAntiprotonBurst: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedAntiprotonWave: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorInvertedTetryonBeam: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedTetryonPulse: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedTetryonBurst: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedTetryonWave: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorInvertedChronitonBeam: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedChronitonPulse: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedChronitonBurst: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedChronitonWave: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorInvertedGravitonBeam: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorInvertedGravitonPulse: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorInvertedGravitonBurst: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorInvertedGravitonWave: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 3 },
    },
    deflectorInvertedPolaronBeam: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedPolaronPulse: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedPolaronBurst: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 5 },
    },
    deflectorInvertedPolaronWave: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedAntiprotonBeam: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedAntiprotonPulse: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedAntiprotonBurst: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedAntiprotonWave: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 3 },
    },
    deflectorModulatedTetryonBeam: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedTetryonPulse: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedTetryonBurst: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedTetryonWave: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 3 },
    },
    deflectorModulatedChronitonBeam: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedChronitonPulse: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedChronitonBurst: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedChronitonWave: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 3 },
    },
    deflectorModulatedGravitonBeam: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 3 },
    },
    deflectorModulatedGravitonPulse: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 3 },
    },
    deflectorModulatedGravitonBurst: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 3 },
    },
    deflectorModulatedGravitonWave: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 2 },
    },
    deflectorModulatedPolaronBeam: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedPolaronPulse: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedPolaronBurst: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 4 },
    },
    deflectorModulatedPolaronWave: {
        targetType: 'enemy',
        crew: 'science',
        traits: ['expendable'],
        parameters: { cost: 3 },
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

export type DeflectorTargetedCardType = KeysWithTargetType<typeof cardDefinitions, 'deflector'>;

export type LocationTargetedCardType = KeysWithTargetType<typeof cardDefinitions, 'location'>;

export type ChoiceCardType = KeysWithTargetType<typeof cardDefinitions, 'choice'>;
