/**
 * Traits that can be assigned to cards, giving them unique behavior.
 *
 * - 'primary': Card returns to hand when played (if no other primary card in hand).
 * - 'expendable': Card is destroyed when played (not added to discard pile).
 * - 'energyWeapon': A group of tactical weapon cards. Some charge cards only target cards with this trait.
 * - 'torpedoWeapon': A group of tactical weapon cards. Some charge cards only target cards with this trait.
 */
export type CardTrait = 'primary' | 'expendable' | 'energyWeapon' | 'torpedoWeapon';
