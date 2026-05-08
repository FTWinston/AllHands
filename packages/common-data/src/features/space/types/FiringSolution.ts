export interface FiringSolution {
    /* Distance to the target in game units */
    range: number;

    /* Relative bearing to the target in radians (-π = directly behind, 0 = directly ahead, π = directly behind) */
    relativeBearing: number;

    /* Aspect angle of the target in radians (-π = target's front, 0 = target's rear, π = target's front) */
    targetAspect: number;
}
