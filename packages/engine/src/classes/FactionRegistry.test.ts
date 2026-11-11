import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { AiShip } from 'src/state/AiShip';
import { shipSetup, setupGameRoom } from 'src/testUtils';
import { describe, it, expect } from 'vitest';

const rooms = setupGameRoom();

function createGameState() {
    return rooms.createState();
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
        state.factionRegistry.relationsChanged.addListener('test', () => {
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

    describe('setEncounterFactions', () => {
        it('adds factions with their relations, to each other and to the lasting factions', () => {
            const state = createGameState();
            state.initFactions([{ id: 'player' }], 'player');
            const reg = state.factionRegistry;

            reg.setEncounterFactions([
                { id: 'clinic', relations: { player: RelationshipType.Friendly, raiders: RelationshipType.Hostile } },
                { id: 'raiders', relations: { player: RelationshipType.Hostile } },
            ]);

            expect(reg.getRelationshipBetween('player', 'clinic')).toBe(RelationshipType.Friendly);
            expect(reg.getRelationshipBetween('player', 'raiders')).toBe(RelationshipType.Hostile);
            expect(reg.getRelationshipBetween('raiders', 'clinic')).toBe(RelationshipType.Hostile);
        });

        it('replaces the previous factions, leaving no trace of them', () => {
            const state = createGameState();
            state.initFactions([{ id: 'player' }], 'player');
            const reg = state.factionRegistry;
            const player = state.factions.get('player')!;

            reg.setEncounterFactions([{ id: 'raiders', relations: { player: RelationshipType.Hostile } }]);
            reg.setEncounterFactions([{ id: 'wardens', relations: { player: RelationshipType.Hostile } }]);

            expect([...state.factions.keys()].sort()).toEqual(['player', 'wardens']);
            expect([...player.relations.keys()]).toEqual(['wardens']);
            expect(reg.getRelationshipBetween('player', 'raiders')).toBe(RelationshipType.Neutral);

            reg.setEncounterFactions([]);

            expect([...state.factions.keys()]).toEqual(['player']);
            expect(player.relations.size).toBe(0);
        });

        it('keeps the lasting factions themselves, as clients hold onto the player faction', () => {
            const state = createGameState();
            state.initFactions([{ id: 'player' }], 'player');
            const player = state.factions.get('player');

            state.factionRegistry.setEncounterFactions([{ id: 'raiders', relations: { player: RelationshipType.Hostile } }]);
            state.factionRegistry.setEncounterFactions([]);

            expect(state.factions.get('player')).toBe(player);
        });

        it('fires relationsChanged', () => {
            const state = createGameState();
            state.initFactions([{ id: 'player' }], 'player');
            let fired = 0;
            state.factionRegistry.relationsChanged.addListener('test', () => {
                fired++;
            });

            state.factionRegistry.setEncounterFactions([{ id: 'raiders', relations: { player: RelationshipType.Hostile } }]);

            expect(fired).toBe(1);
        });
    });
});
