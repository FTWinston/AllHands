import { describe, expect, it } from 'vitest';
import { isHelmCardPlayable } from './isHelmCardPlayable';

describe('isHelmCardPlayable', () => {
    it('allows Drift only with some Momentum', () => {
        expect(isHelmCardPlayable({ type: 'drift' }, { momentumLevel: 0 })).toBe(false);
        expect(isHelmCardPlayable({ type: 'drift' }, { momentumLevel: 1 })).toBe(true);
    });

    it('allows Juke only with the 2 Momentum it spends', () => {
        expect(isHelmCardPlayable({ type: 'juke' }, { momentumLevel: 1 })).toBe(false);
        expect(isHelmCardPlayable({ type: 'juke' }, { momentumLevel: 2 })).toBe(true);
    });

    it('allows cards that only want Momentum without it, as well as those that never use it', () => {
        expect(isHelmCardPlayable({ type: 'hairpin' }, { momentumLevel: 0 })).toBe(true);
        expect(isHelmCardPlayable({ type: 'punchIt' }, { momentumLevel: 0 })).toBe(true);
        expect(isHelmCardPlayable({ type: 'slowAndSteady' }, { momentumLevel: 0 })).toBe(true);
    });

    it('goes by the card as modified', () => {
        expect(isHelmCardPlayable({ type: 'juke', modifiers: { momentumCost: -1 } }, { momentumLevel: 1 })).toBe(true);
    });
});
