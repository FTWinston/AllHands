import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import type { FactionConfig } from 'common-data/features/space/types/FactionConfig';

/** The only faction that lasts for the whole game. Every other one is a side declared by an encounter (see `Encounter.sides`). */
export const playerFactionId = 'player';

/** A side that is hostile to the player ships, for an encounter's `sides`. */
export function hostileToPlayer(id: string): FactionConfig {
    return { id, relations: { [playerFactionId]: RelationshipType.Hostile } };
}
