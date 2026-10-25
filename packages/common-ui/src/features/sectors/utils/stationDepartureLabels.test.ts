import { describe, expect, it } from 'vitest';
import { getStationDepartureLabel } from './stationDepartureLabels';

describe('getStationDepartureLabel', () => {
    it('says who is shopping, until they close the shop', () => {
        expect(getStationDepartureLabel('tactical', true)).toBe('Tactical is shopping');
        expect(getStationDepartureLabel('helm', true)).toBe('Helm is shopping');
    });

    it('says the ship is ready to depart once the shop is closed, or at a repair station', () => {
        expect(getStationDepartureLabel('tactical', false)).toBe('Ready to depart');
        expect(getStationDepartureLabel(null, false)).toBe('Ready to depart');
    });
});
