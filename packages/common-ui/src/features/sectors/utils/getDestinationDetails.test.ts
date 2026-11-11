import { describe, expect, it } from 'vitest';
import { getDestinationDetails } from './getDestinationDetails';
import type { SectorDestinationInfo } from 'common-data/features/sectors/types/SectorDestinationInfo';

const repairStation: SectorDestinationInfo = {
    id: 'n1',
    kind: 'repair',
    name: 'Repair Station',
};

describe('getDestinationDetails', () => {
    it('lists environment and objective', () => {
        expect(getDestinationDetails({
            id: 'n2',
            kind: 'combat',
            name: 'Ember Belt',
            environment: 'asteroidField',
            objective: { type: 'survive', durationMs: 90_000 },
        })).toEqual([
            { label: 'Environment', value: 'Asteroid field' },
            { label: 'Objective', value: 'Survive for 1 minute 30 seconds' },
        ]);
    });

    it('ends with what whoever is asking for help had to say', () => {
        expect(getDestinationDetails({
            id: 'n2',
            kind: 'combat',
            name: 'Hauler Local 12: toll dispute',
            environment: 'deepSpace',
            objective: { type: 'clear' },
            request: 'Wardens on the Kessin jump point, charging forty percent.',
        })).toEqual([
            { label: 'Environment', value: 'Deep space' },
            { label: 'Objective', value: 'Clear the area' },
            { label: 'Message', value: 'Wardens on the Kessin jump point, charging forty percent.' },
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
