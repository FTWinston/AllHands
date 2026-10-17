import type { SectorNodeInfo } from './SectorNodeInfo';
import type { IArray } from '@colyseus/react';

/** Client-facing graph and position; the engine's schema state implements this. */
export interface SectorMapInfo {
    sectorId: string;
    sectorName: string;
    /** Zero-based index of the current sector. */
    sectorIndex: number;
    sectorCount: number;
    nodes: IArray<SectorNodeInfo>;
    /** Null until the first node is chosen. */
    currentNodeId: string | null;
    visitedNodeIds: IArray<string>;
    /** Nodes selectable from the current position. */
    availableNodeIds: IArray<string>;
}

/** Sector intro/outro/defeat message shown on the viewscreen. */
export interface SectorMessageInfo {
    kind: 'intro' | 'outro' | 'defeat';
    title: string;
    text: string;
}
