/**
 * Traits that can be assigned to cards, giving them unique behavior.
 *
 * - 'primary': Card returns to hand when played (if no other primary card in hand).
 * - 'expendable': Card is destroyed when played (not added to discard pile).
 *
 * If a card has both traits, expendable takes precedence.
 */
export type CardTrait = 'primary' | 'expendable';
