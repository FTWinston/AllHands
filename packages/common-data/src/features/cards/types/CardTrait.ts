/**
 * A sub-group of @see CardTrait that applies to weapons, affecting how they behave when fired.
 * - area: damage nearby targets
 * - cumbersome: needs to hold aim for 2 seconds
 * - draining: adds a power draining effect on target system
 * - dampening: extra reduction to shield power
 * - persistent: adds a damage over time effect to target system
 * - disabling: adds an effect that prevents the target system from playing cards
 * - penetrating: partly bypasses shields
 * - disrupting: Adds a disrupted card to target system hand. Card deals damage when played.
 */
export type WeaponTrait
    = 'area'
        | 'cumbersome'
        | 'draining'
        | 'dampening'
        | 'persistent'
        | 'disabling'
        | 'penetrating'
        | 'disrupting';

/**
 * Traits that can be assigned to cards, giving them unique behavior.
 * Includes all @see WeaponTrait values, plus:
 * - primary: Card returns to hand when played (if no other primary card in hand).
 * - expendable: Card is destroyed when played (not added to discard pile).
 * - energyWeapon: A group of tactical weapon cards. Some charge cards only target cards with this trait.
 * - torpedoWeapon: A group of tactical weapon cards. Some charge cards only target cards with this trait.
 */
export type CardTrait = WeaponTrait | 'primary' | 'expendable' | 'energyWeapon' | 'torpedoWeapon';
