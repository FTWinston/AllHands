import { describe, expect, it } from 'vitest';
import { describeDeflector } from './deflectors.ui';

describe('deflector descriptions', () => {
    it('say what each combination does, with its numbers', () => {
        expect(describeDeflector({ modifier: 'Modulated', substance: 'Antiproton', delivery: 'Pulse' }))
            .toBe('Raises damage taken by every system of the target by 20% for 15s. Weakened by up to 50% by shields.');
        expect(describeDeflector({ modifier: 'Phased', substance: 'Tetryon', delivery: 'Beam' }))
            .toBe('Makes one system of the target (the one being scanned, if any) 30% easier to hit for 15s. Drains 20% of the shields of the target, and scrambles their tuning. Ignores shields.');
        expect(describeDeflector({ modifier: 'Coherent', substance: 'Chroniton', delivery: 'Field' }))
            .toBe('Leaves a field around the target for 40s that makes every system of each hostile ship inside it fail every other card draw. Weakened by up to 50% by shields.');
        expect(describeDeflector({ modifier: 'Inverted', substance: 'Graviton', delivery: 'Burst' }))
            .toBe('Speeds up manoeuvres of your ship and each friendly ship within 6 of it by 10% for 15s.');
        expect(describeDeflector({ modifier: 'Inverted', substance: 'Polaron', delivery: 'Beam' }))
            .toBe('Gives one system of your ship (the kind being scanned, if any) 2 extra power for 10s.');
        expect(describeDeflector({ modifier: 'Modulated', substance: 'Tetryon', delivery: 'Field' }))
            .toBe('Leaves a field around the target for 20s that makes every system of each hostile ship inside it 15% easier to hit. Drains 2.5% of the shields of each hostile ship inside it each second, and scrambles their tuning. Weakened by up to 50% by shields.');
        expect(describeDeflector({ modifier: 'Inverted', substance: 'Antiproton', delivery: 'Field' }))
            .toBe('Leaves a field around your ship for 20s that cuts damage taken by every system of each friendly ship inside it by 20%.');
        expect(describeDeflector({ modifier: 'Inverted', substance: 'Tetryon', delivery: 'Pulse' }))
            .toBe('Makes every system of your ship 15% harder to hit for 15s. Restores 10% of the shields of your ship.');
    });
});
