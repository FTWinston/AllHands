import { describe, expect, it } from 'vitest';
import { getShieldAbsorption } from './shieldStats';

describe('getShieldAbsorption', () => {
    it.each([
        [1, 1, 60],
        [3, 1, 80],
        [5, 1, 100],
        [5, 0.5, 75],
        [3, 0, 0],
        [0, 1, 0],
    ])('absorbs a share set by power %i and fullness %f', (power, fullness, expected) => {
        expect(getShieldAbsorption(power, fullness)).toBe(expected);
    });
});
