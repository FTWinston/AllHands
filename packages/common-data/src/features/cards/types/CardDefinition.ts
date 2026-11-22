import { ShipSystem } from 'src/features/ships/types/ShipSystem';
import { CardType } from '../utils/cardDefinitions';
import { CardParameters } from './CardParameters';
import { CardRarity } from './CardRarity';
import { CardTargetType } from './CardTargetType';
import { CardTrait } from './CardTrait';

interface CommonCardDefinition {
    targetType: CardTargetType;
    system: ShipSystem;
    parameters: CardParameters;
    traits?: CardTrait[];
    /** How seldom shops offer this card, and how much it costs there. Common when not given. */
    rarity?: CardRarity;
}

export type NoTargetCardDefinition = CommonCardDefinition & {
    targetType: 'no-target';
};

export type ChoiceCardDefinition<TCardKey extends string = CardType> = CommonCardDefinition & {
    targetType: 'choice';
    cards: [TCardKey, TCardKey] | [TCardKey, TCardKey, TCardKey];
};

export type WeaponSlotTargetCardDefinition = CommonCardDefinition & {
    targetType: 'weapon-slot';
    parameters: CardParameters & {
        chargePerUse: number;
        totalCharge: number;
        maxRange: number;
        firingArc: number;
        damage: number;
    };
};

export type WeaponTargetCardDefinition = CommonCardDefinition & {
    targetType: 'weapon';
    requiredWeaponTrait?: CardTrait;
    /** Whether the card acts on a weapon once, rather than staying on it as its modifier. Such a card can be played on a weapon that already has a modifier, and doesn't stop it taking one. */
    instant?: boolean;
};

export type EnemyTargetCardDefinition = CommonCardDefinition & {
    targetType: 'enemy';
};

export type DeflectorEffectModifier = 'Phased' | 'Coherent' | 'Inverted' | 'Modulated';
export type DefaultDeflectorEffectModifier = 'Modulated';
export type AssignableDeflectorEffectModifier = Exclude<DeflectorEffectModifier, DefaultDeflectorEffectModifier>;

export type DeflectorEffectSubstance = 'Antiproton' | 'Tetryon' | 'Chroniton' | 'Graviton' | 'Polaron';
export type DefaultDeflectorEffectSubstance = 'Graviton';
export type AssignableDeflectorEffectSubstance = Exclude<DeflectorEffectSubstance, DefaultDeflectorEffectSubstance>;

export type DeflectorEffectDelivery = 'Beam' | 'Pulse' | 'Burst' | 'Field';
export type DefaultDeflectorEffectDelivery = 'Field';
export type AssignableDeflectorEffectDelivery = Exclude<DeflectorEffectDelivery, DefaultDeflectorEffectDelivery>;

export type ScanTargetCardDefinition = CommonCardDefinition & {
    targetType: 'scan';
    deflectorModifier?: AssignableDeflectorEffectModifier;
    deflectorSubstance?: AssignableDeflectorEffectSubstance;
    deflectorDelivery?: AssignableDeflectorEffectDelivery;
};

export type SystemTargetCardDefinition = CommonCardDefinition & {
    targetType: 'system';
};

/** Which other ships a ship-targeted card can be played on, by how the playing ship's faction regards theirs. */
export type ShipTargetRelationship = 'hostile' | 'friendly' | 'any';

export type ShipTargetCardDefinition = CommonCardDefinition & {
    targetType: 'ship';
    /** Which other ships this card can be played on. Any other ship when not given. */
    targetRelationship?: ShipTargetRelationship;
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

export type LocationTargetCardDefinition = CommonCardDefinition & {
    targetType: 'location';
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

    parameters: CardParameters & {
        evasion: number;
    };
};

// The TCardKey generic allows choice cards to reference other cards without creating a circular reference.
export type CardDefinition<TCardKey extends string = CardType> = NoTargetCardDefinition
    | ChoiceCardDefinition<TCardKey>
    | WeaponSlotTargetCardDefinition
    | WeaponTargetCardDefinition
    | EnemyTargetCardDefinition
    | ScanTargetCardDefinition
    | SystemTargetCardDefinition
    | LocationTargetCardDefinition
    | ShipTargetCardDefinition;
