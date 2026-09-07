export const enum ExtraTraitType {
    /* An extra trait that behaves like a normal trait: It stays on the card. */
    Normal = 1,
    /* An extra trait that is removed from the card when it is played, but not when it is played into a slot. */
    RemoveOnPlay = 2,
    /* An extra trait that can be removed by specific effects. */
    Negative = 3,
}
