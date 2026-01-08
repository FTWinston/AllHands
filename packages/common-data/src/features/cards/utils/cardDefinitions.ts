import { CardDefinition, CardMotionSegmentFacing } from '../types/CardDefinition';
import { CardTargetType } from '../types/CardTargetType';

// Enforce that values are of a card definition type, without widening the key type to "string"
function defineCardDefinitions<T extends Record<string, CardDefinition>>(defs: T) {
    return defs;
}

export const cardDefinitions = defineCardDefinitions({
    flare: {
        targetType: 'no-target',
        crew: 'tactical',
        cost: 2,
    },
    smokeScreen: {
        targetType: 'no-target',
        crew: 'engineer',
        cost: 3,
    },
    phaserCannon: {
        targetType: 'weapon-slot',
        crew: 'tactical',
        cost: 2,
    },
    phaserStrip: {
        targetType: 'weapon-slot',
        crew: 'tactical',
        cost: 4,
    },
    photonTorpedo: {
        targetType: 'weapon-slot',
        crew: 'tactical',
        cost: 3,
    },
    photonicCannon: {
        targetType: 'weapon-slot',
        crew: 'tactical',
        cost: 5,
    },

    exampleWeaponTarget: {
        targetType: 'weapon',
        crew: 'tactical',
        cost: 1,
    },
    exampleWeaponSlotTarget: {
        targetType: 'weapon-slot',
        crew: 'tactical',
        cost: 2,
    },
    exampleEnemyTarget: {
        targetType: 'enemy',
        crew: 'tactical',
        cost: 3,
    },
    exampleSystemTarget: {
        targetType: 'system',
        crew: 'engineer',
        cost: 2,
    },
    slowAndSteady: {
        targetType: 'location',
        crew: 'helm',
        cost: 1,
        motionData: [
            {
                // Rotate to face target first, then move straight towards it
                startFacing: CardMotionSegmentFacing.FinalVector,
                endFacing: CardMotionSegmentFacing.FinalVector,
                baseRotationSpeed: 0.75,
                baseSpeed: 0.75,
            },
        ],
    },
    zigZag: {
        targetType: 'location',
        crew: 'helm',
        cost: 2,
        motionData: [
            {
                // Rotate to face target first, then zig-zag towards it
                startFacing: CardMotionSegmentFacing.FinalVector,
                endFacing: CardMotionSegmentFacing.FinalVector,
                baseRotationSpeed: 1.25,
                baseSpeed: 1,
                perpendicularPositionOffsets: [-0.15, 0.25, -0.25, 0.15],
                minDistance: 3,
            },
        ],
    },
    strafe: {
        targetType: 'location',
        crew: 'helm',
        cost: 1,
        motionData: [
            {
                // Don't rotate before moving, keep current heading throughout
                baseRotationSpeed: 1,
                baseSpeed: 0.4,
                maxDistance: 4,
            },
        ],
    },
    sweepLeft: {
        targetType: 'location',
        crew: 'helm',
        cost: 2,
        motionData: [
            {
                startFacing: CardMotionSegmentFacing.FinalVector,
                startFacingOffset: -Math.PI / 4, // Start facing 45 degrees left of destination
                endFacing: CardMotionSegmentFacing.FinalVector,
                endFacingOffset: Math.PI / 4, // End facing 45 degrees right of destination
                baseRotationSpeed: 1,
                baseSpeed: 1,
                // Sine curve bulging right (positive = right of movement direction)
                perpendicularPositionOffsets: [0.14, 0.26, 0.35, 0.39, 0.39, 0.35, 0.26, 0.14],
            },
        ],
    },
    sweepRight: {
        targetType: 'location',
        crew: 'helm',
        cost: 2,
        motionData: [
            {
                startFacing: CardMotionSegmentFacing.FinalVector,
                startFacingOffset: Math.PI / 4, // Start facing 45 degrees right of destination
                endFacing: CardMotionSegmentFacing.FinalVector,
                endFacingOffset: -Math.PI / 4, // End facing 45 degrees left of destination
                baseRotationSpeed: 1,
                baseSpeed: 1,
                // Sine curve bulging left (negative = left of movement direction)
                perpendicularPositionOffsets: [-0.14, -0.26, -0.35, -0.39, -0.39, -0.35, -0.26, -0.14],
            },
        ],
    },
    exampleNoTarget: {
        targetType: 'no-target',
        crew: 'sensors',
        cost: 2,
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

export type LocationTargetedCardType = KeysWithTargetType<typeof cardDefinitions, 'location'>;
