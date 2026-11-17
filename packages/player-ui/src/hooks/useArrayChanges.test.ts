import { describe, expect, it } from 'vitest';
import { mergeKnownItems } from './useArrayChanges';

type Card = { id: number; traits: string[] };

const getId = (card: Card) => card.id;

describe('mergeKnownItems', () => {
    it('shows the current version of an item that is still present', () => {
        const before: Card = { id: 1, traits: [] };
        const after: Card = { id: 1, traits: ['damaged'] };

        expect(mergeKnownItems([before], [after], getId)).toEqual([after]);
        expect(mergeKnownItems([before], [after], getId)[0]).toBe(after);
    });

    it('keeps an item that has left, in its place, so that it can animate out', () => {
        const leaving: Card = { id: 1, traits: [] };
        const staying: Card = { id: 2, traits: [] };
        const stayingChanged: Card = { id: 2, traits: ['stabilised'] };

        expect(mergeKnownItems([leaving, staying], [stayingChanged], getId)).toEqual([leaving, stayingChanged]);
    });

    it('adds new items after the known ones', () => {
        const known: Card = { id: 1, traits: [] };
        const added: Card = { id: 2, traits: [] };

        expect(mergeKnownItems([known], [added, known], getId)).toEqual([known, added]);
    });
});
