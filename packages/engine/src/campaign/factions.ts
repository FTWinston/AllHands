import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import type { FactionConfig } from 'common-data/features/space/types/FactionConfig';

export const playerFactionId = 'player';

const hostileToPlayer = { [playerFactionId]: RelationshipType.Hostile };

/** Placeholder factions, until the campaign is written. */
export const factionConfigs: FactionConfig[] = [
    { id: playerFactionId },
    { id: 'factionA', relations: hostileToPlayer },
    { id: 'factionB', relations: hostileToPlayer },
    { id: 'factionC', relations: hostileToPlayer },
];
