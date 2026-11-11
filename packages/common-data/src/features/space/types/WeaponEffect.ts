import { ObjectId } from './GameObjectInfo';
import { ObjectAppearance } from './ObjectAppearance';
import { Position } from './Position';
import { Vector2D } from './Vector2D';

/** How long a projectile takes to reach its target, in game-time milliseconds. Its damage lands when it arrives. */
export const projectileFlightTime = 1200;

/** A weapon or deflector being fired. How it looks is up to each client, based on the card type. */
export interface ShotEffect {
    type: 'shot';
    /** The type of the card that fired. */
    weapon: string;
    /** The object ID of the firing ship. */
    sourceId: ObjectId;
    /** The object ID of the target. If not specified, the shot goes straight ahead of its source. */
    targetId?: ObjectId;
    /** Target position when fired, used if the target no longer exists (e.g. destroyed by this shot). */
    targetPosition?: Vector2D;
    /** True if this shot won't hit. Shots that do hit are followed by an impact, once they land. */
    missed?: boolean;
    /** The server game time at which the effect starts. */
    startTime: number;
}

/** A shot landing on a ship. */
export interface ImpactEffect {
    type: 'impact';
    /** The object ID of the firing ship, which may no longer exist. */
    sourceId: ObjectId;
    /** The object ID of the ship that was hit, which may no longer exist. */
    targetId: ObjectId;
    /** How much damage got through the shields. Zero if they absorbed it all. */
    damage: number;
    /** The server game time at which the effect starts. */
    startTime: number;
}

/** A ship exploding. Everything needed to draw it is included, as the ship itself is removed straight away. */
export interface ExplosionEffect {
    type: 'explosion';
    /** The object ID of the ship that exploded, which no longer exists. */
    sourceId: ObjectId;
    appearance: ObjectAppearance;
    position: Position;
    /** The server game time at which the effect starts. */
    startTime: number;
}

/** How long a ship gathers itself before it jumps to warp, in game-time milliseconds. Our own ship's jump is timed to land as the screen fades out. */
export const warpAwayWindUp = 500;

/**
 * A ship jumping to warp, leaving the encounter in one piece. Everything needed to draw it is included, as most ships are removed straight away.
 * A player ship isn't, though: it's still there until the scene changes, so clients hide it once its jump starts.
 */
export interface WarpAwayEffect {
    type: 'warpAway';
    /** The object ID of the ship that jumped, which may no longer exist. */
    sourceId: ObjectId;
    appearance: ObjectAppearance;
    /** Where the ship jumped from, and which way it was facing: that's the way it goes. */
    position: Position;
    /** The server game time at which the effect starts. */
    startTime: number;
}

/** Something to be displayed on SpaceMap clients. */
export type WeaponEffect = ShotEffect | ImpactEffect | ExplosionEffect | WarpAwayEffect;
