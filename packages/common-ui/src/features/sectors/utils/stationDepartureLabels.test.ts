import { describe, expect, it } from 'vitest';
import { getStationDepartureNote } from './stationDepartureLabels';

describe('getStationDepartureNote', () => {
    it('tells the shopping crew member to close their shop, and everyone else who they are waiting on', () => {
        expect(getStationDepartureNote('shopping', 'tactical', 'tactical')).toMatch(/Close the shop/);
        expect(getStationDepartureNote('shopping', 'tactical', 'helm')).toBe('Waiting for Tactical to finish shopping, before you can warp away.');
        expect(getStationDepartureNote('shopping', 'tactical', 'science')).toBe('Waiting for Tactical to finish shopping.');
        expect(getStationDepartureNote('shopping', 'tactical', null)).toBe('Waiting for Tactical to finish shopping.');
    });

    it('tells helm to close the shop at a navigation beacon, to get the Warp Away card', () => {
        expect(getStationDepartureNote('shopping', 'helm', 'helm')).toBe('Close the shop when you\'re done, to get the Warp Away card.');
        expect(getStationDepartureNote('shopping', 'helm', null)).toBe('Waiting for Helm to finish shopping.');
    });

    it('tells helm to close their deck view, then play Warp Away', () => {
        expect(getStationDepartureNote('helmDeckView', null, 'helm')).toMatch(/Close your deck/);
        expect(getStationDepartureNote('helmDeckView', 'science', null)).toMatch(/Waiting for Helm/);
        expect(getStationDepartureNote('ready', null, 'helm')).toMatch(/Play Warp Away/);
        expect(getStationDepartureNote('ready', null, 'engineer')).toBe('Waiting for Helm to warp away.');
    });

    it('says nothing away from a station', () => {
        expect(getStationDepartureNote(null, null, 'helm')).toBeNull();
        expect(getStationDepartureNote(undefined, null, null)).toBeNull();
    });
});
