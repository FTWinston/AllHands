import { isStationKind } from 'common-data/features/sectors/utils/isStationKind';
import type { GamePhase } from 'common-data/features/sectors/types/GamePhase';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';

/**
 * True while a campaign is running but not mid-encounter (sector intro, map, or outro), or at a station; crew show their non-encounter UI.
 * Stations are technically an encounter, but nothing is simulated there.
 */
export function isOutsideEncounter(phase: GamePhase | null, encounterKind: SectorNodeKind | null): boolean {
    return phase !== null && (phase !== 'encounter' || isStationKind(encounterKind));
}
