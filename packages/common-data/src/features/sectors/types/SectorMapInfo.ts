import type { SectorNodeKind } from './SectorNodeInfo';
import type { IArray } from '@colyseus/react';

/** A node as the viewscreen map draws it: name, layout and links only. What a node holds is only revealed by science's long range sensors. */
export interface SectorMapNodeInfo {
    id: string;
    kind: SectorNodeKind;
    name: string;
    /** Short label the map shows instead of the name, e.g. A1, B1, C3. */
    gridReference: string;
    /** Whether a combat node is a tougher, elite encounter. Shown from the outset, for route planning. */
    elite: boolean;
    /** Normalised 0..1 layout position; x runs start to boss, and y is one of a fixed set of evenly spaced rows. */
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
    /** Starts at the sector's start node. */
    currentNodeId: string;
    visitedNodeIds: IArray<string>;
    /** Nodes selectable from the current position. */
    availableNodeIds: IArray<string>;
}
