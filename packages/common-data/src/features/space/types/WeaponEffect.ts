import { ObjectId } from './GameObjectInfo';

/** The visual type of weapon effect to display. */
export type WeaponEffectType = 'beam' | 'projectile' | 'explosion';

/** A weapon effect to be displayed on SpaceMap clients. */
export interface WeaponEffect {
    /** The type of visual effect. */
    type: WeaponEffectType;
    /** The object ID of the source (firing) ship. */
    sourceId: ObjectId;
    /** The object ID of the target. If not specified, the effect projects forward from the source, rotating with it. */
    targetId?: ObjectId;
    /** CSS color string for the effect (e.g. '#ff0000', 'orange'). */
    color: string;
    /** Thickness of the effect in world units. */
    thickness: number;
    /** Brightness multiplier (1 = normal, >1 = brighter glow). Default 1. */
    brightness?: number;
    /** Duration of the effect in game-time milliseconds. */
    duration: number;
    /** The server game time at which the effect starts. */
    startTime: number;
}
