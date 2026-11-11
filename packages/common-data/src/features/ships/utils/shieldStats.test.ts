import { describe, expect, it } from 'vitest';
import { getShieldAbsorption, getShieldDrainPercent } from './shieldStats';

describe('getShieldAbsorption', () => {
    it.each([
        [0, 0],
        [1, 60],
        [3, 80],
        [5, 100],
        [7, 100],
    ])('at power %i, absorbs %i%% of each hit', (power, expected) => {
        expect(getShieldAbsorption(power)).toBe(expected);
    });
});

describe('getShieldDrainPercent', () => {
    it.each([
        [1, 100],
        [3, 80],
        [5, 60],
    ])('at power %i, drains the shields by %i%% of what they absorb', (power, expected) => {
        expect(getShieldDrainPercent(power, false)).toBe(expected);
    });

    it('drains reinforced shields by three quarters as much', () => {
        expect(getShieldDrainPercent(3, true)).toBe(60);
        expect(getShieldDrainPercent(5, true)).toBe(45);
    });
});
