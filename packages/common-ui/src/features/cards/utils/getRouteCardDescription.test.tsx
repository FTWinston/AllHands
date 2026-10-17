import { describe, expect, it } from 'vitest';
import { getRouteCardDetails } from './getRouteCardDescription';
import type { RouteCardInfo } from 'common-data/features/cards/types/RouteCardInfo';

const basicRoute: RouteCardInfo = {
    nodeId: 'n1',
    nodeKind: 'combat',
    title: 'Ember Belt',
    detail: 'basic',
};

describe('getRouteCardDetails', () => {
    it('is empty for basic route cards, even with extra fields', () => {
        expect(getRouteCardDetails({ ...basicRoute, environment: 'nebula', factionId: 'raiders' })).toEqual([]);
    });

    it('lists environment, hostile faction and objective for full route cards', () => {
        expect(getRouteCardDetails({
            ...basicRoute,
            detail: 'full',
            environment: 'asteroidField',
            factionId: 'factionA',
            objective: { type: 'survive', durationMs: 90_000 },
        })).toEqual([
            { label: 'Environment', value: 'Asteroid field' },
            { label: 'Hostile', value: 'Faction A' },
            { label: 'Objective', value: 'Survive for 1 minute 30 seconds' },
        ]);
    });

    it('omits missing details on full repair route cards', () => {
        expect(getRouteCardDetails({ ...basicRoute, detail: 'full', nodeKind: 'repair' })).toEqual([]);
    });
});
