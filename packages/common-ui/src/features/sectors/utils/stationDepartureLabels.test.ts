import { describe, expect, it } from 'vitest';
import { getStationDepartureLabel } from './stationDepartureLabels';

describe('getStationDepartureLabel', () => {
    it('says who is shopping, until the shop station is complete', () => {
        expect(getStationDepartureLabel('tactical', false)).toBe('Tactical is shopping');
        expect(getStationDepartureLabel('helm', false)).toBe('Helm is shopping');
    });

    it('says the crew is ready to depart once complete, or at a repair station', () => {
        expect(getStationDepartureLabel('tactical', true)).toBe('Ready to depart');
        expect(getStationDepartureLabel(null, true)).toBe('Ready to depart');
        expect(getStationDepartureLabel(null, false)).toBe('Ready to depart');
    });
});
