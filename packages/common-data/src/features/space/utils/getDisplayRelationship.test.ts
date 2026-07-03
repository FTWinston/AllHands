import { describe, it, expect } from 'vitest';
import { ScenarioConfig } from '../../../types/ScenarioConfig';
import { RelationshipViewer } from '../types/GameObjectInfo';
import { RelationshipType } from '../types/RelationshipType';
import { getDisplayRelationship, resolveSetupRelationship } from './getDisplayRelationship';

/** Minimal ScenarioConfig-shaped literal: resolveSetupRelationship only reads `factions` and `playerFaction`. */
function config(playerFaction: string, relations: Array<{ id: string; relations?: Record<string, RelationshipType> }>): ScenarioConfig {
    return { playerFaction, factions: relations } as ScenarioConfig;
}

function viewer(shipId: string | null, faction: string | null, relations: RelationshipViewer['relations']): RelationshipViewer {
    return { shipId, faction, relations };
}

describe('getDisplayRelationship', () => {
    it('returns Self for the viewer\'s own ship', () => {
        expect(getDisplayRelationship({ id: 's1', faction: 'player' }, viewer('s1', 'player', null))).toBe(RelationshipType.Self);
    });

    it('returns None when the object has no faction', () => {
        expect(getDisplayRelationship({ id: 'e1', faction: null }, viewer('s1', 'player', null))).toBe(RelationshipType.None);
    });

    it('returns None when the viewer has no faction', () => {
        expect(getDisplayRelationship({ id: 'e1', faction: 'raiders' }, viewer('s1', null, { raiders: RelationshipType.Hostile }))).toBe(RelationshipType.None);
    });

    it('returns Friendly when the object shares the viewer faction', () => {
        expect(getDisplayRelationship({ id: 'e1', faction: 'player' }, viewer('s1', 'player', null))).toBe(RelationshipType.Friendly);
    });

    it('looks up the relationship in the viewer relations map for other factions', () => {
        const o = { id: 'e1', faction: 'raiders' };
        expect(getDisplayRelationship(o, viewer('s1', 'player', { raiders: RelationshipType.Hostile }))).toBe(RelationshipType.Hostile);
    });

    it('returns Neutral when no entry exists for the other faction', () => {
        const o = { id: 'e1', faction: 'raiders' };
        expect(getDisplayRelationship(o, viewer('s1', 'player', {}))).toBe(RelationshipType.Neutral);
    });

    it('returns Neutral when the viewer has no relations map at all', () => {
        const o = { id: 'e1', faction: 'raiders' };
        expect(getDisplayRelationship(o, viewer('s1', 'player', null))).toBe(RelationshipType.Neutral);
    });

    describe('with a Map-like relations object (engine MapSchema form)', () => {
        it('looks up the relationship in the viewer relations map', () => {
            const o = { id: 'e1', faction: 'raiders' };
            const relations = new Map([['raiders', RelationshipType.Hostile]]);
            expect(getDisplayRelationship(o, viewer('s1', 'player', relations))).toBe(RelationshipType.Hostile);
        });
    });
});

describe('resolveSetupRelationship', () => {
    it('returns None for an undefined faction', () => {
        const cfg = config('player', [{ id: 'player' }]);
        expect(resolveSetupRelationship(cfg, undefined)).toBe(RelationshipType.None);
    });

    it('returns Friendly when the faction is the player faction', () => {
        const cfg = config('player', [{ id: 'player' }]);
        expect(resolveSetupRelationship(cfg, 'player')).toBe(RelationshipType.Friendly);
    });

    it('honors a declared relation from the player faction side', () => {
        const cfg = config('player', [
            { id: 'player', relations: { raiders: RelationshipType.Neutral } },
            { id: 'raiders' },
        ]);
        expect(resolveSetupRelationship(cfg, 'raiders')).toBe(RelationshipType.Neutral);
    });

    it('honors a declared relation from the other faction side', () => {
        const cfg = config('player', [
            { id: 'player' },
            { id: 'raiders', relations: { player: RelationshipType.Neutral } },
        ]);
        expect(resolveSetupRelationship(cfg, 'raiders')).toBe(RelationshipType.Neutral);
    });

    it('treats Hostile as winning when either direction declares it', () => {
        const cfg = config('player', [
            { id: 'player', relations: { raiders: RelationshipType.Neutral } },
            { id: 'raiders', relations: { player: RelationshipType.Hostile } },
        ]);
        expect(resolveSetupRelationship(cfg, 'raiders')).toBe(RelationshipType.Hostile);
    });

    it('returns Neutral for an undeclared pair', () => {
        const cfg = config('player', [{ id: 'player' }, { id: 'raiders' }]);
        expect(resolveSetupRelationship(cfg, 'raiders')).toBe(RelationshipType.Neutral);
    });
});
