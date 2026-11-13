import { describe, expect, it } from 'vitest';
import { getNodeKindLabel, getObjectiveLabel } from './sectorLabels';

describe('getNodeKindLabel', () => {
    it('calls an encounter a request, as that is what the map shows of it: someone asking for help', () => {
        expect(getNodeKindLabel('combat')).toBe('Request');
    });

    it('calls an elite encounter a priority request', () => {
        expect(getNodeKindLabel('combat', true)).toBe('Priority request');
    });

    it('names stations for what they are', () => {
        expect(getNodeKindLabel('repair')).toBe('Repair station');
    });
});

describe('getObjectiveLabel', () => {
    it('describes each kind of objective', () => {
        expect(getObjectiveLabel({ type: 'clear' })).toBe('Clear the area');
        expect(getObjectiveLabel({ type: 'survive', durationMs: 60_000 })).toBe('Survive for 1 minute');
        expect(getObjectiveLabel({ type: 'boss' })).toBe('Defeat the boss');
    });

    it('names who or what the objective is about, where it is about something', () => {
        expect(getObjectiveLabel({ type: 'protect', subject: 'Marrow' })).toBe('Protect Marrow');
        expect(getObjectiveLabel({ type: 'disable', subject: 'Customs Platform 7' })).toBe('Disable Customs Platform 7');
        expect(getObjectiveLabel({ type: 'recover', subject: 'the water module' })).toBe('Recover the water module');
    });
});
