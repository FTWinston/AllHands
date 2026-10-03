import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { getDisplayRelationship } from 'common-data/features/space/utils/getDisplayRelationship';
import { AiShip } from 'src/state/AiShip';
import { shipSetup, setupGameRoom } from 'src/testUtils';
import { describe, it, expect } from 'vitest';

const rooms = setupGameRoom();

function createGameState() {
    const state = rooms.createState();
    state.initFactions([
        { id: 'player' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ], 'player');
    return state;
}

describe('GameObject faction relationships (via getDisplayRelationship)', () => {
    it('resolves Hostile/Friendly from the synced FactionState relations, not a per-object map', () => {
        const state = createGameState();
        const ship = new AiShip(state, { ...shipSetup('raiders'), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(ship);

        const viewer = { shipId: null, faction: 'player', relations: state.factions.get('player')!.relations };

        expect(ship.faction).toBe('raiders');
        expect(getDisplayRelationship(ship, viewer)).toBe(RelationshipType.Hostile);
        expect(getDisplayRelationship({ id: 'other', faction: 'player' }, viewer)).toBe(RelationshipType.Friendly);
    });

    it('reflects a runtime relationship flip made via setRelationship', () => {
        const state = createGameState();
        const ship = new AiShip(state, { ...shipSetup('raiders'), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(ship);

        const viewer = { shipId: null, faction: 'player', relations: state.factions.get('player')!.relations };
        expect(getDisplayRelationship(ship, viewer)).toBe(RelationshipType.Hostile);

        state.factionRegistry.setRelationship('raiders', 'player', RelationshipType.Friendly);

        expect(getDisplayRelationship(ship, viewer)).toBe(RelationshipType.Friendly);
    });
});
