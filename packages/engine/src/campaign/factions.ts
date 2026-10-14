import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import type { FactionConfig } from 'common-data/features/space/types/FactionConfig';

export const playerFactionId = 'player';

const hostileToPlayer = { [playerFactionId]: RelationshipType.Hostile };

export const factionConfigs: FactionConfig[] = [
    { id: playerFactionId },
    { id: 'raiders', relations: hostileToPlayer },
    { id: 'cartel', relations: hostileToPlayer },
    { id: 'hegemony', relations: hostileToPlayer },
];
