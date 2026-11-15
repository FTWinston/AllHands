/**
 * What links cards that work well together, for work orders: a card that "wants" a tag is a good match for one that "provides" it, and vice versa.
 * Tags live only in the engine, and are never sent to clients. Each card's tags are its engine definition's `synergy`.
 * Work orders only match cards within one crew member's shop, so a tag only links cards of the same station.
 */
export type SynergyTag
    = 'zeroCost'
    // Engineer
        | 'charge'
        | 'flux'
    // Helm
        | 'momentum'
        | 'steadyPlatform'
    // Tactical
        | 'energyWeapon'
        | 'torpedoWeapon'
        | 'lock'
        | 'weaponCharge'
    // Science
        | 'insight'
        | 'particles';

/** The synergy tags of one card type. Each card should have at most two in all: usually one thing it provides, and at most one it wants. */
export type CardSynergy = {
    provides?: readonly SynergyTag[];
    wants?: readonly SynergyTag[];
};
