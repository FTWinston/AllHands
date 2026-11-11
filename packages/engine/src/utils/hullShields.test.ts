import { describe, expect, it } from 'vitest';
import { resolveShieldHit, ShieldHitModifiers } from './hullShields';

const noMode: ShieldHitModifiers = { tuned: false, reinforced: false };

// At power 3, shields absorb 80% of each hit, and are drained by 80% of what they absorb.
describe('resolveShieldHit', () => {
    it('absorbs a share of the hit, drains the shields by less than that, and lets the rest through', () => {
        expect(resolveShieldHit(50, 100, 100, 3, noMode)).toEqual({ drain: 32, passedThrough: 10, collapsed: false });
    });

    it('absorbs the same share however full the shields are', () => {
        expect(resolveShieldHit(50, 50, 100, 3, noMode)).toEqual({ drain: 32, passedThrough: 10, collapsed: false });
    });

    it('absorbs everything at full power, for the least drain', () => {
        expect(resolveShieldHit(50, 100, 100, 5, noMode)).toEqual({ drain: 30, passedThrough: 0, collapsed: false });
    });

    it('absorbs nothing while the hull is unpowered, leaving the shields as they are', () => {
        expect(resolveShieldHit(50, 100, 100, 0, noMode)).toEqual({ drain: 0, passedThrough: 50, collapsed: false });
    });

    it('reduces a hit that the shields are tuned against, before they absorb it', () => {
        // 40% less: a hit of 30, of which 24 is absorbed.
        expect(resolveShieldHit(50, 100, 100, 3, { ...noMode, tuned: true })).toEqual({ drain: 19, passedThrough: 6, collapsed: false });
    });

    it('still reduces a hit the shields are tuned against once they\'re down', () => {
        expect(resolveShieldHit(50, 0, 100, 3, { ...noMode, tuned: true })).toEqual({ drain: 0, passedThrough: 30, collapsed: false });
    });

    it('drains reinforced shields less, for the same damage absorbed', () => {
        expect(resolveShieldHit(50, 100, 100, 3, { ...noMode, reinforced: true })).toEqual({ drain: 24, passedThrough: 10, collapsed: false });
    });

    it('collapses shields that a hit leaves below a tenth of their capacity', () => {
        // Drained by 32, to 8 of 100, which is lost too.
        expect(resolveShieldHit(50, 40, 100, 3, noMode)).toEqual({ drain: 40, passedThrough: 10, collapsed: true });

        // Drained to exactly a tenth, which holds.
        expect(resolveShieldHit(50, 42, 100, 3, noMode)).toEqual({ drain: 32, passedThrough: 10, collapsed: false });
    });

    it('only absorbs what the shields have left to pay for, and lets the rest through', () => {
        // 16 shield pays for 20 of the 40 they'd otherwise absorb.
        expect(resolveShieldHit(50, 16, 100, 3, noMode)).toEqual({ drain: 16, passedThrough: 30, collapsed: true });
    });

    it('always knocks the shields out eventually, however small the hits', () => {
        let shield = 90;
        let hits = 0;

        while (shield > 0 && hits < 100) {
            shield -= resolveShieldHit(10, shield, 90, 3, noMode).drain;
            hits++;
        }

        expect(shield).toBe(0);
        expect(hits).toBe(14);
    });
});
