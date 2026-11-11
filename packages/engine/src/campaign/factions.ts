import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import type { FactionConfig } from 'common-data/features/space/types/FactionConfig';

/** The only faction that lasts for the whole game. Every other one is declared by an encounter (see `Encounter.factions`). */
export const playerFactionId = 'player';

/** A faction that is hostile to the player ships, for an encounter's `factions`. */
export function hostileToPlayer(id: string): FactionConfig {
    return { id, relations: { [playerFactionId]: RelationshipType.Hostile } };
}
