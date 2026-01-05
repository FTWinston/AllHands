import { CardDefinition, CardMotionSegmentFacing, CardMotionSegmentRotationBehavior } from '../types/CardDefinition';
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
    exampleLocationTarget: {
        targetType: 'location',
        crew: 'helm',
        cost: 1,
        motionData: [
            {
                behavior: CardMotionSegmentRotationBehavior.RotateWhileMoving,
                endFacing: CardMotionSegmentFacing.FinalVector,
                baseRotationSpeed: 1,
                baseSpeed: 1,
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
