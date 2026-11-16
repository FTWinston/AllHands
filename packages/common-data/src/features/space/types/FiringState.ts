/** Can a weapon slot fire at a specific target? This is the result of assessing that. */
export const enum FiringState {
    NoWeapon,
    NotCharged,
    NoTarget,
    CanFire,
    RangeTooFar,
    RangeTooClose,
    RelativeBearingTooWide,
    TargetAspectObscured,
    /** A cumbersome weapon that's in position, but hasn't held its aim for long enough yet. */
    Aiming,
}
