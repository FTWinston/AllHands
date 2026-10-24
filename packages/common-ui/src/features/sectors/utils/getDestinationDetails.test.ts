import { describe, expect, it } from 'vitest';
import { getDestinationDetails } from './getDestinationDetails';
import type { SectorDestinationInfo } from 'common-data/features/sectors/types/SectorDestinationInfo';

const repairStation: SectorDestinationInfo = {
    id: 'n1',
    kind: 'repair',
    name: 'Repair Station',
};

describe('getDestinationDetails', () => {
    it('lists environment, hostile faction and objective', () => {
        expect(getDestinationDetails({
            id: 'n2',
            kind: 'combat',
            name: 'Ember Belt',
            environment: 'asteroidField',
            factionId: 'factionA',
            objective: { type: 'survive', durationMs: 90_000 },
        })).toEqual([
            { label: 'Environment', value: 'Asteroid field' },
            { label: 'Hostile', value: 'Faction A' },
            { label: 'Objective', value: 'Survive for 1 minute 30 seconds' },
        ]);
    });

    it('omits missing details', () => {
        expect(getDestinationDetails(repairStation)).toEqual([]);
    });

    it('lists what a shop station sells', () => {
        expect(getDestinationDetails({ id: 'n3', kind: 'navigationBeacon', name: 'Beacon' })).toEqual([
            { label: 'Sells', value: 'Helm cards' },
        ]);
    });
});
