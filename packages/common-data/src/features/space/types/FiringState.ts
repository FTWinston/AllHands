/** Can a weapon slot fire at a specific target? This is the result of assessing that. */
export const enum FiringState {
    NoWeapon,
    NotPrimed,
    NotCharged,
    NoTarget,
    CanFire,
    RangeTooFar,
    RangeTooClose,
    RelativeBearingTooWide,
    TargetAspectObscured,
}
