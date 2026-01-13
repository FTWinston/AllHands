import { CrewRoleName } from '../../ships/types/CrewRole';
import { CardTargetType } from './CardTargetType';

interface CommonCardDefinition {
    targetType: CardTargetType;
    crew: CrewRoleName;
    cost: number;
}

export type NoTargetCardDefinition = CommonCardDefinition & {
    targetType: 'no-target';
};

export type ChoiceCardDefinition<TCardKey extends string = string> = CommonCardDefinition & {
    targetType: 'choice';
    cards: [TCardKey, TCardKey] | [TCardKey, TCardKey, TCardKey];
};

export type WeaponSlotTargetCardDefinition = CommonCardDefinition & {
    targetType: 'weapon-slot';
};

export type WeaponTargetCardDefinition = CommonCardDefinition & {
    targetType: 'weapon';
};

export type EnemyTargetCardDefinition = CommonCardDefinition & {
    targetType: 'enemy';
};

export type SystemTargetCardDefinition = CommonCardDefinition & {
    targetType: 'system';
};

export type LocationTargetCardDefinition = CommonCardDefinition & {
    targetType: 'location';
    motionData: CardMotionSegment[];
};

export enum CardMotionSegmentFacing {
    /** Keep the current angle, don't change facing */
    Current,
    /** Face towards the next location in the sequence */
    NextVector,
    /** Face towards the previous location (or starting position) */
    PreviousVector,
    /** Face towards the final destination */
    FinalVector,
}

export type CardMotionSegment = {
    /**
     * The direction to face at the start of the movement.
     * If specified (and different from current), the ship rotates to this angle BEFORE moving.
     * If not specified, the ship keeps its current angle at the start and any rotation happens during movement.
     */
    startFacing?: CardMotionSegmentFacing;
    /** Offset (in radians) to add to the calculated startFacing angle. */
    startFacingOffset?: number;
    /**
     * The direction to face at the end of the movement.
     * The ship will rotate towards this angle during movement (interpolated across intermediate steps).
     * Defaults to Current if not specified.
     */
    endFacing?: CardMotionSegmentFacing;
    /** Offset (in radians) to add to the calculated endFacing angle. */
    endFacingOffset?: number;
    /** Movement speed. If 0, the ship only rotates without moving. */
    baseSpeed: number;
    baseRotationSpeed: number;
    /**
     * Explicit lateral offsets at intermediate points, scaled by total distance.
     * Positive values offset to the right of the movement direction, negative to the left.
     */
    perpendicularPositionOffsets?: number[];
    minDistance?: number;
    maxDistance?: number;
};

// The TCardKey generic allows choice cards to reference other cards without creating a circular reference.
export type CardDefinition<TCardKey extends string = string> = NoTargetCardDefinition
    | ChoiceCardDefinition<TCardKey>
    | WeaponSlotTargetCardDefinition
    | WeaponTargetCardDefinition
    | EnemyTargetCardDefinition
    | SystemTargetCardDefinition
    | LocationTargetCardDefinition;
