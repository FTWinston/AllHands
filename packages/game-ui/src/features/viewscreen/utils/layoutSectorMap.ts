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
    /** Edges leave their source horizontally, turn vertically at this x, then enter their target horizontally. The same for every edge between two columns. */
    bendX: number;
}

export interface SectorMapLayout {
    nodes: MapNodeLayout[];
    edges: MapEdgeLayout[];
}

function clamp01(value: number): number {
    return Math.min(1, Math.max(0, value));
}

/**
 * How far across the gap between two columns every edge turns, as a fraction of its width.
 * A little left of centre, leaving room for the arrowheads.
 */
const bendFraction = 0.45;

/**
 * An SVG path for an edge, running horizontally from `startX` to the edge's bend, vertically to the target's row, then horizontally to `endX`,
 * with corners rounded to `cornerRadius` where there's room.
 */
export function getEdgePath(edge: Pick<MapEdgeLayout, 'y1' | 'y2' | 'bendX'>, startX: number, endX: number, cornerRadius: number): string {
    const { y1, y2, bendX } = edge;
    if (y1 === y2) {
        return `M${startX} ${y1}H${endX}`;
    }

    const direction = Math.sign(y2 - y1);
    const radius = Math.max(0, Math.min(cornerRadius, Math.abs(y2 - y1) / 2, bendX - startX, endX - bendX));

    // Turning down from heading right is clockwise, and turning back to the right is then anticlockwise; heading up is the reverse.
    const firstSweep = direction > 0 ? 1 : 0;
    const secondSweep = 1 - firstSweep;

    return `M${startX} ${y1}H${bendX - radius}`
        + `A${radius} ${radius} 0 0 ${firstSweep} ${bendX} ${y1 + direction * radius}`
        + `V${y2 - direction * radius}`
        + `A${radius} ${radius} 0 0 ${secondSweep} ${bendX + radius} ${y2}`
        + `H${endX}`;
}

/** Maps the normalised node positions into a `width` x `height` box inset by `padding`, routes edges between them, and classifies nodes and edges. */
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

            edges.push({ id, fromId: from.node.id, toId, status, x1: from.x, y1: from.y, x2: to.x, y2: to.y, bendX: from.x + bendFraction * (to.x - from.x) });
        }
    }

    return { nodes, edges };
}
