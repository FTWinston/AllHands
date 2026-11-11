/**
 * A sub-group of @see CardTrait that applies to weapons, affecting how they behave when fired.
 * - area: damage nearby targets.
 * - cumbersome: needs to hold aim for 2 seconds.
 * - draining: adds a power draining effect on target system.
 * - dampening: extra reduction to shield power.
 * - persistent: adds a damage over time effect to target system.
 * - disabling: adds an effect that prevents the target system from playing cards.
 * - penetrating: partly bypasses shields.
 * - disrupting: Adds a disrupted card to target system hand. Card deals damage when played.
 * - destabilizing: adds an unstable effect to cards in the target system's hand.
 * - energyWeapon: A group of tactical weapon cards. Some charge cards only target cards with this trait, and shields can be tuned against it.
 * - torpedoWeapon: A group of tactical weapon cards. Some charge cards only target cards with this trait, and shields can be tuned against it.
 */
export type WeaponTrait
    = 'energyWeapon'
        | 'torpedoWeapon'
        | 'area'
        | 'cumbersome'
        | 'draining'
        | 'dampening'
        | 'persistent'
        | 'disabling'
        | 'penetrating'
        | 'disrupting'
        | 'destabilizing';

/**
 * Traits that can be assigned to cards, giving them unique behavior.
 * Includes all @see WeaponTrait values, plus:
 * - damaged: Card cannot be used.
 * - stabilised: Card functionality has been restored after being damaged.
 * - critical: Card cannot be used and cannot be stabilised.
 * - primary: Card returns to hand when played, or when it's used up from a slot, rather than going to the deck.
 *   Not if another primary card of the same type is already in the hand, though: then it goes to the deck as normal.
 *   An encounter can deal one that's also expendable, to keep it in a crew member's hand for as long as the encounter lasts.
 * - expendable: Card is destroyed when played (not added to the deck).
 * - unstable: Card shuffles back into the deck when played, instead of going on the end.
 * - rechargeable: A weapon with this trait can be topped up with one more card after it has been fully charged. Doing so removes the trait.
 * - priority: Cannot be discarded or used for charging, can only be played.
 * - unplayable: Card cannot be played or discarded.
 */
export type CardTrait = WeaponTrait | 'damaged' | 'stabilised' | 'critical' | 'primary' | 'expendable' | 'unstable' | 'rechargeable' | 'priority' | 'unplayable';
