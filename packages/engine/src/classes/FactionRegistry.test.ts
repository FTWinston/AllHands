import { ClockTimer } from '@colyseus/timer';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { AiShip } from 'src/state/AiShip';
import { GameState } from 'src/state/GameState';
import { shipSetup } from 'src/testUtils';
import { IdProvider } from 'src/types/IdProvider';
import { describe, it, expect } from 'vitest';

function createGameState() {
    let nextId = 1;
    const idPool: IdProvider = { getId: () => String(nextId++), releaseId: () => {} };
    return new GameState(idPool, new ClockTimer(false));
}

describe('FactionRegistry', () => {
    it('defaults to Neutral for undeclared pairs and Friendly for same faction', () => {
        const state = createGameState();
        state.initFactions([{ id: 'a' }, { id: 'b' }], 'a');
        const reg = state.factionRegistry;
        expect(reg.getRelationshipBetween('a', 'b')).toBe(RelationshipType.Neutral);
        expect(reg.getRelationshipBetween('a', 'a')).toBe(RelationshipType.Friendly);
    });

    it('returns None when either faction is missing', () => {
        const state = createGameState();
        state.initFactions([{ id: 'a' }], 'a');
        expect(state.factionRegistry.getRelationshipBetween('a', null)).toBe(RelationshipType.None);
        expect(state.factionRegistry.getRelationshipBetween(null, 'a')).toBe(RelationshipType.None);
    });

    it('applies declared relations symmetrically', () => {
        const state = createGameState();
        state.initFactions([
            { id: 'player' },
            { id: 'raiders', relations: { player: RelationshipType.Hostile } },
        ], 'player');
        expect(state.factionRegistry.getRelationshipBetween('player', 'raiders')).toBe(RelationshipType.Hostile);
        expect(state.factionRegistry.getRelationshipBetween('raiders', 'player')).toBe(RelationshipType.Hostile);
    });

    it('resolves conflicting declarations with the more hostile relation', () => {
        const state = createGameState();
        state.initFactions([
            { id: 'a', relations: { b: RelationshipType.Friendly } },
            { id: 'b', relations: { a: RelationshipType.Hostile } },
        ], 'a');
        expect(state.factionRegistry.getRelationshipBetween('a', 'b')).toBe(RelationshipType.Hostile);
    });

    it('setRelationship updates both directions and fires relationsChanged', () => {
        const state = createGameState();
        state.initFactions([{ id: 'a' }, { id: 'b' }], 'a');
        let fired = 0;
        state.factionRegistry.relationsChanged.addListener('test', false, () => {
            fired++;
        });
        state.factionRegistry.setRelationship('a', 'b', RelationshipType.Hostile);
        expect(state.factionRegistry.getRelationshipBetween('b', 'a')).toBe(RelationshipType.Hostile);
        expect(fired).toBe(1);
    });

    it('initFactions records the player faction', () => {
        const state = createGameState();
        state.initFactions([{ id: 'player' }], 'player');
        expect(state.playerFaction).toBe('player');
    });

    // getRelationship/areHostile take full GameObject instances (GameObject has a protected
    // `gameState` member, so a plain `{ faction }` literal isn't structurally assignable) - use
    // AiShip via shipSetup, as GameObject.test.ts does.
    it('getRelationship delegates to getRelationshipBetween using each object\'s faction', () => {
        const state = createGameState();
        state.initFactions([
            { id: 'player' },
            { id: 'raiders', relations: { player: RelationshipType.Hostile } },
        ], 'player');
        const player = new AiShip(state, { ...shipSetup('player'), goal: { type: 'search-and-destroy' }, skill: 1 });
        const raider = new AiShip(state, { ...shipSetup('raiders'), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(player);
        state.add(raider);

        expect(state.factionRegistry.getRelationship(player, raider)).toBe(RelationshipType.Hostile);
        expect(state.factionRegistry.getRelationship(player, player)).toBe(RelationshipType.Friendly);
    });

    it('areHostile is true only when the pair\'s relationship is Hostile', () => {
        const state = createGameState();
        state.initFactions([
            { id: 'player' },
            { id: 'raiders', relations: { player: RelationshipType.Hostile } },
            { id: 'neutrals' },
        ], 'player');
        const player = new AiShip(state, { ...shipSetup('player'), goal: { type: 'search-and-destroy' }, skill: 1 });
        const raider = new AiShip(state, { ...shipSetup('raiders'), goal: { type: 'search-and-destroy' }, skill: 1 });
        const neutral = new AiShip(state, { ...shipSetup('neutrals'), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(player);
        state.add(raider);
        state.add(neutral);

        expect(state.factionRegistry.areHostile(player, raider)).toBe(true);
        expect(state.factionRegistry.areHostile(player, neutral)).toBe(false);
    });
});
