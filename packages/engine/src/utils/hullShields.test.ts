import { describe, expect, it } from 'vitest';
import { HitBonusLevels, resolveShieldHit } from './hullShields';

const noBonuses: HitBonusLevels = { reinforced: 0, braced: 0, tuned: 0 };

// Full shields at power 3 absorb 80% of each hit.
describe('resolveShieldHit', () => {
    it('drains the shields by the share they absorb, and lets the rest through', () => {
        expect(resolveShieldHit(20, 100, 100, 3, noBonuses)).toEqual({
            drain: 16,
            passedThrough: 4,
            prevented: noBonuses,
        });
    });

    it('reduces a hit from the weapon type the shields are tuned against, before the shields absorb it', () => {
        expect(resolveShieldHit(40, 100, 100, 3, { ...noBonuses, tuned: 1 })).toEqual({
            drain: 24,
            passedThrough: 6,
            prevented: { ...noBonuses, tuned: 10 },
        });
    });

    it('drains the shields less while they\'re reinforced', () => {
        expect(resolveShieldHit(40, 100, 100, 3, { ...noBonuses, reinforced: 2 })).toEqual({
            drain: 22,
            passedThrough: 8,
            prevented: { ...noBonuses, reinforced: 10 },
        });
    });

    it('lets less damage past the shields while the hull is braced', () => {
        expect(resolveShieldHit(40, 0, 100, 3, { ...noBonuses, braced: 1 })).toEqual({
            drain: 0,
            passedThrough: 35,
            prevented: { ...noBonuses, braced: 5 },
        });
    });

    it('doesn\'t use up reinforcement when the shields are down, or bracing when nothing gets past them', () => {
        expect(resolveShieldHit(40, 0, 100, 3, { ...noBonuses, reinforced: 1 }).prevented.reinforced).toBe(0);
        expect(resolveShieldHit(20, 100, 100, 5, { ...noBonuses, braced: 1 }).prevented.braced).toBe(0);
    });

    it('never prevents more than half of a hit, leaving later bonuses unused', () => {
        expect(resolveShieldHit(20, 100, 100, 3, { reinforced: 3, braced: 3, tuned: 3 })).toEqual({
            drain: 8,
            passedThrough: 2,
            prevented: { reinforced: 0, braced: 0, tuned: 10 },
        });
    });

    it('prevents a smaller share of a big hit than of a small one', () => {
        const bonuses = { reinforced: 1, braced: 1, tuned: 0 };

        expect(resolveShieldHit(10, 0, 100, 3, bonuses).passedThrough).toBe(5);
        expect(resolveShieldHit(60, 0, 100, 3, bonuses).passedThrough).toBe(55);
    });

    it('can\'t drain the shields below zero, and lets the rest through', () => {
        expect(resolveShieldHit(50, 10, 10, 5, { ...noBonuses, reinforced: 1 })).toEqual({
            drain: 10,
            passedThrough: 35,
            prevented: { ...noBonuses, reinforced: 5 },
        });
    });
});
