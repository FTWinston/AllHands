import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { AiShip } from 'src/state/AiShip';
import type { GameObject } from 'src/state/GameObject';
import type { GameState } from 'src/state/GameState';

export function isHostileShip(state: GameState, object: GameObject): object is AiShip {
    return object instanceof AiShip
        && (state.playerFaction === null
            || state.factionRegistry.getRelationshipBetween(state.playerFaction, object.faction) === RelationshipType.Hostile);
}

export function getHostileShips(state: GameState): AiShip[] {
    return [...state.objects.values()].filter((object): object is AiShip => isHostileShip(state, object));
}
