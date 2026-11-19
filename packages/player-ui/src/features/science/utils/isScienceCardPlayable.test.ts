import { describe, expect, it } from 'vitest';
import { isScienceCardPlayable, ScienceCardPlayContext } from './isScienceCardPlayable';

const scanningSystem: ScienceCardPlayContext = { insight: 5, isScanningShip: true, isScanningSystem: true };
const scanningShipOnly: ScienceCardPlayContext = { insight: 5, isScanningShip: true, isScanningSystem: false };
const scanningNothing: ScienceCardPlayContext = { insight: 5, isScanningShip: false, isScanningSystem: false };

describe('isScienceCardPlayable', () => {
    it('allows Eureka only with 3 Insight and a scanned system', () => {
        expect(isScienceCardPlayable({ type: 'eureka' }, scanningSystem)).toBe(true);
        expect(isScienceCardPlayable({ type: 'eureka' }, { ...scanningSystem, insight: 3 })).toBe(true);
        expect(isScienceCardPlayable({ type: 'eureka' }, { ...scanningSystem, insight: 2 })).toBe(false);
        expect(isScienceCardPlayable({ type: 'eureka' }, scanningShipOnly)).toBe(false);
    });

    it('allows Predictive Model only with 2 Insight and a scanned ship', () => {
        expect(isScienceCardPlayable({ type: 'predictiveModel' }, { ...scanningShipOnly, insight: 2 })).toBe(true);
        expect(isScienceCardPlayable({ type: 'predictiveModel' }, { ...scanningShipOnly, insight: 1 })).toBe(false);
        expect(isScienceCardPlayable({ type: 'predictiveModel' }, scanningNothing)).toBe(false);
    });

    it('allows Firing Solution with 2 Insight, whatever is scanned', () => {
        expect(isScienceCardPlayable({ type: 'firingSolution' }, { ...scanningNothing, insight: 2 })).toBe(true);
        expect(isScienceCardPlayable({ type: 'firingSolution' }, { ...scanningNothing, insight: 1 })).toBe(false);
    });

    it('allows Plotted Course only with 2 Insight and a scanned ship', () => {
        expect(isScienceCardPlayable({ type: 'plottedCourse' }, { ...scanningShipOnly, insight: 2 })).toBe(true);
        expect(isScienceCardPlayable({ type: 'plottedCourse' }, { ...scanningShipOnly, insight: 1 })).toBe(false);
        expect(isScienceCardPlayable({ type: 'plottedCourse' }, { ...scanningNothing, insight: 5 })).toBe(false);
    });

    it('counts modifiers to a card\'s Insight cost', () => {
        expect(isScienceCardPlayable({ type: 'eureka', modifiers: { insightCost: -1 } }, { ...scanningSystem, insight: 2 })).toBe(true);
        expect(isScienceCardPlayable({ type: 'eureka', modifiers: { insightCost: 1 } }, { ...scanningSystem, insight: 3 })).toBe(false);
    });

    it.each(['catalyse', 'halfLife', 'crossReaction', 'saturate'] as const)('allows %s only with a scanned system, whatever the Insight', (type) => {
        expect(isScienceCardPlayable({ type }, { ...scanningSystem, insight: 0 })).toBe(true);
        expect(isScienceCardPlayable({ type }, scanningShipOnly)).toBe(false);
    });

    it('allows other cards whatever is scanned', () => {
        expect(isScienceCardPlayable({ type: 'passiveScan' }, { ...scanningNothing, insight: 0 })).toBe(true);
        expect(isScienceCardPlayable({ type: 'deepScan' }, { ...scanningNothing, insight: 0 })).toBe(true);
    });
});
