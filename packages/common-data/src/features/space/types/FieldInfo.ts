import type { DeflectorEffectSubstance } from 'src/features/cards/types/CardDefinition';

/** A lingering zone in space, an oval, that a deflector leaves: it acts on the ships inside it until it expires. */
export interface FieldInfo {
    id: string;
    /** Where the centre of the oval is. */
    x: number;
    y: number;
    /** How the oval is turned, in the same units as `Position.angle`: the direction its long axis (`radiusX`) points in. */
    angle: number;
    /** Half the oval's length, along its long axis. */
    radiusX: number;
    /** Half the oval's width, across it. */
    radiusY: number;
    /** The game time at which the field expires, in milliseconds. */
    endTime: number;
    /** What the field does to ships inside it, which tints it. */
    substance: DeflectorEffectSubstance;
    /** Whether it helps friendly ships (an Inverted deflector's), rather than hindering hostile ones. */
    friendly: boolean;
}
