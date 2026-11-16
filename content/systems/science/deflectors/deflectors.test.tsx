import { describe, expect, it } from 'vitest';
import { describeDeflector } from './deflectors.ui';

describe('deflector descriptions', () => {
    it('say what each combination does, with its numbers', () => {
        expect(describeDeflector({ modifier: 'Modulated', substance: 'Antiproton', delivery: 'Pulse' }))
            .toBe('Raises damage taken by every system of the target by 20% for 15s. Weakened by up to 50% by shields.');
        expect(describeDeflector({ modifier: 'Phased', substance: 'Tetryon', delivery: 'Beam' }))
            .toBe('Makes one system of the target (the one being scanned, if any) 30% easier to hit for 15s. Ignores shields.');
        expect(describeDeflector({ modifier: 'Coherent', substance: 'Chroniton', delivery: 'Field' }))
            .toBe('Makes every system of the target fail every other card draw for 45s. Weakened by up to 50% by shields.');
        expect(describeDeflector({ modifier: 'Inverted', substance: 'Graviton', delivery: 'Burst' }))
            .toBe('Speeds up manoeuvres of your ship and each friendly ship within 6 of it by 10% for 15s.');
        expect(describeDeflector({ modifier: 'Inverted', substance: 'Polaron', delivery: 'Beam' }))
            .toBe('Gives one system of your ship (the kind being scanned, if any) 2 extra power for 10s.');
    });
});
