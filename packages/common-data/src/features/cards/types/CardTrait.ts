/**
 * Traits that can be assigned to cards, giving them unique behavior.
 *
 * - 'Primary': Card returns to hand when played (if no other Primary card in hand).
 * - 'Expendable': Card is destroyed when played (not added to discard pile).
 *
 * If a card has both traits, Expendable takes precedence.
 */
export type CardTrait = 'Primary' | 'Expendable';
