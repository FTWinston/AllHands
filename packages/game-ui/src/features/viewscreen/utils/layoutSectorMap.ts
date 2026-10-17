import { type SectorMapInfo, type SectorMapNodeInfo } from 'common-data/features/sectors/types/SectorMapInfo';

export type MapNodeStatus = 'current' | 'visited' | 'available' | 'unreachable';
export type MapEdgeStatus = 'travelled' | 'available' | 'unreachable';

export interface MapNodeLayout {
    node: SectorMapNodeInfo;
    status: MapNodeStatus;
    /** Position in the layout's coordinate space. */
    x: number;
    y: number;
}

export interface MapEdgeLayout {
    id: string;
    fromId: string;
    toId: string;
    status: MapEdgeStatus;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface SectorMapLayout {
    nodes: MapNodeLayout[];
    edges: MapEdgeLayout[];
}

function clamp01(value: number): number {
    return Math.min(1, Math.max(0, value));
}

/** Maps the normalised node positions into a `width` x `height` box inset by `padding`, and classifies nodes and edges. */
export function layoutSectorMap(
    map: Pick<SectorMapInfo, 'nodes' | 'currentNodeId' | 'visitedNodeIds' | 'availableNodeIds'>,
    width: number,
    height: number,
    padding: number
): SectorMapLayout {
    const visited = new Set(map.visitedNodeIds);
    const available = new Set(map.availableNodeIds);

    const getNodeStatus = (id: string): MapNodeStatus => {
        if (id === map.currentNodeId) {
            return 'current';
        }
        if (visited.has(id)) {
            return 'visited';
        }
        return available.has(id) ? 'available' : 'unreachable';
    };

    const nodes = map.nodes.map<MapNodeLayout>(node => ({
        node,
        status: getNodeStatus(node.id),
        x: padding + clamp01(node.x) * (width - 2 * padding),
        y: padding + clamp01(node.y) * (height - 2 * padding),
    }));

    const byId = new Map(nodes.map(layout => [layout.node.id, layout]));

    const travelled = new Set<string>();
    for (let i = 1; i < map.visitedNodeIds.length; i++) {
        travelled.add(`${map.visitedNodeIds[i - 1]}->${map.visitedNodeIds[i]}`);
    }

    const edges: MapEdgeLayout[] = [];
    for (const from of nodes) {
        for (const toId of from.node.next) {
            const to = byId.get(toId);
            if (!to) {
                continue;
            }

            const id = `${from.node.id}->${toId}`;
            let status: MapEdgeStatus = 'unreachable';
            if (travelled.has(id)) {
                status = 'travelled';
            } else if (from.node.id === map.currentNodeId && available.has(toId)) {
                status = 'available';
            }

            edges.push({ id, fromId: from.node.id, toId, status, x1: from.x, y1: from.y, x2: to.x, y2: to.y });
        }
    }

    return { nodes, edges };
}
