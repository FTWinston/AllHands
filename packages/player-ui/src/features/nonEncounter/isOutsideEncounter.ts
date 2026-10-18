import type { GamePhase } from 'common-data/features/sectors/types/GamePhase';

/** True while a campaign is running but not mid-encounter (sector intro, map, or outro); crew show their non-encounter UI. */
export function isOutsideEncounter(phase: GamePhase | null): boolean {
    return phase !== null && phase !== 'encounter';
}
