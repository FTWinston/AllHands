import { describe, it, expect } from 'vitest';
import { resolveAiConfig } from './types';

describe('resolveAiConfig', () => {
    const base = { goal: { type: 'search-and-destroy' as const }, skill: 0.5 };

    it('applies defaults', () => {
        const config = resolveAiConfig({ ...base } as never);
        expect(config.fleeThreshold).toBe(0.25);
        expect(config.priorities).toEqual({ helm: 1, tactical: 1, science: 1, engineer: 1 });
    });

    it('clamps skill to 0..1 and respects explicit values', () => {
        const config = resolveAiConfig({ ...base, skill: 7, fleeThreshold: 0, priorities: { tactical: 2 } } as never);
        expect(config.skill).toBe(1);
        expect(config.fleeThreshold).toBe(0);
        expect(config.priorities.tactical).toBe(2);
        expect(config.priorities.helm).toBe(1);
    });

    it('clamps negative priorities to 0 (disabled) and keeps 0 as-is', () => {
        const config = resolveAiConfig({ ...base, priorities: { helm: -5, science: 0 } } as never);
        expect(config.priorities.helm).toBe(0);
        expect(config.priorities.science).toBe(0);
        expect(config.priorities.tactical).toBe(1);
    });
});
