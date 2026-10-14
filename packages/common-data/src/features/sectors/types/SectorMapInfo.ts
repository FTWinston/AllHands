import type { SectorNodeInfo } from './SectorNodeInfo';

/** Client-facing graph and position; the engine's schema state implements this. */
export interface SectorMapInfo {
    sectorId: string;
    sectorName: string;
    /** Zero-based index of the current sector. */
    sectorIndex: number;
    sectorCount: number;
    nodes: readonly SectorNodeInfo[];
    /** Null until the first node is chosen. */
    currentNodeId: string | null;
    visitedNodeIds: readonly string[];
    /** Nodes selectable from the current position. */
    availableNodeIds: readonly string[];
}

/** Sector intro/outro message shown on the viewscreen. */
export interface SectorMessageInfo {
    kind: 'intro' | 'outro';
    title: string;
    text: string;
}
