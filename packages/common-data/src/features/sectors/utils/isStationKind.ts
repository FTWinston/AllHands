import type { SectorNodeKind } from '../types/SectorNodeInfo';

/**
 * Whether the given kind of node is a station, where every crew member can view, re-order and sell from their deck.
 * Stations are technically an encounter whose objective is met on arrival, but crew treat them as being outside an encounter.
 */
export function isStationKind(kind: SectorNodeKind | null | undefined): boolean {
    return kind === 'repair';
}
