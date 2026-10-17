import type { SectorNodeKind } from './SectorNodeInfo';
import type { IArray } from '@colyseus/react';

/** A node as the viewscreen map draws it: layout and links only. What a node holds is only revealed by science's route cards. */
export interface SectorMapNodeInfo {
    id: string;
    kind: SectorNodeKind;
    /** Normalised 0..1 layout position; x runs start to boss. */
    x: number;
    y: number;
    /** Ids of the nodes reachable from this one. */
    next: IArray<string>;
}

/** Client-facing graph and position; the engine's schema state implements this. */
export interface SectorMapInfo {
    sectorName: string;
    /** Zero-based index of the current sector. */
    sectorIndex: number;
    sectorCount: number;
    nodes: IArray<SectorMapNodeInfo>;
    /** Null until the first node is chosen. */
    currentNodeId: string | null;
    visitedNodeIds: IArray<string>;
    /** Nodes selectable from the current position. */
    availableNodeIds: IArray<string>;
}
