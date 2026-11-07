import { ArraySchema } from '@colyseus/schema';
import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { CardState } from 'src/state/CardState';
import { describe, it, expect } from 'vitest';
import { mirrorCards } from './mirrorCards';

function createCards(count: number) {
    return new ArraySchema<CardState>(...Array.from({ length: count }, (_, i) => new CardState(i + 1, 'auxPower')));
}

const ids = (cards: ArraySchema<CardState>) => cards.map(card => card.id);

describe('mirrorCards', () => {
    it('copies cards in order, without sharing instances', () => {
        const source = createCards(3);
        const target = new ArraySchema<CardState>();

        mirrorCards(source, target);

        expect(ids(target)).toEqual([1, 2, 3]);
        expect(target.some((card, i) => card === source[i])).toBe(false);
    });

    it('follows cards being drawn, discarded and moved, keeping copies of cards that stay in place', () => {
        const source = createCards(5);
        const target = new ArraySchema<CardState>();
        mirrorCards(source, target);
        const [, copy2, copy3] = target;

        // Draw from the top, then discard to the bottom.
        source.shift();
        source.push(new CardState(9, 'auxPower'));
        mirrorCards(source, target);
        expect(ids(target)).toEqual([2, 3, 4, 5, 9]);
        expect(target[0]).toBe(copy2);
        expect(target[1]).toBe(copy3);

        // Move a card from the bottom to the top, and another down the deck.
        const moved = source.pop()!;
        source.unshift(moved);
        const [second] = source.splice(1, 1);
        source.splice(3, 0, second);
        mirrorCards(source, target);
        expect(ids(target)).toEqual(ids(source));

        source.clear();
        mirrorCards(source, target);
        expect(target.length).toBe(0);
    });

    it('updates modifiers and extra traits of existing copies', () => {
        const source = createCards(2);
        source[0].modifiers.set('power', 1);
        source[1].addTrait('expendable', ExtraTraitType.Normal);
        const target = new ArraySchema<CardState>();
        mirrorCards(source, target);
        const [copy1, copy2] = target;

        source[0].modifiers.set('power', 2);
        source[0].addTrait('damaged', ExtraTraitType.RemoveOnPlay);
        source[1].removeTrait('expendable');
        mirrorCards(source, target);

        expect(target[0]).toBe(copy1);
        expect(target[1]).toBe(copy2);
        expect(copy1.modifiers.get('power')).toBe(2);
        expect(copy1.extraTraits.get('damaged')).toBe(ExtraTraitType.RemoveOnPlay);
        expect(copy2.extraTraits.has('expendable')).toBe(false);
    });
});
