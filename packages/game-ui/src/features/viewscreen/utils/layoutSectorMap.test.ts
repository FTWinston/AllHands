import { describe, expect, it } from 'vitest';
import { layoutSectorMap } from './layoutSectorMap';
import type { SectorMapNodeInfo } from 'common-data/features/sectors/types/SectorMapInfo';

function node(id: string, x: number, y: number, next: string[], kind: SectorMapNodeInfo['kind'] = 'combat'): SectorMapNodeInfo {
    return { id, kind, name: id, x, y, next };
}

const nodes = [
    node('a', 0, 0.5, ['b', 'c']),
    node('b', 0.5, 0, ['d']),
    node('c', 0.5, 1, ['d']),
    node('d', 1, 0.5, [], 'boss'),
];

describe('layoutSectorMap', () => {
    it('insets normalised positions by the padding', () => {
        const layout = layoutSectorMap(
            { nodes, currentNodeId: null, visitedNodeIds: [], availableNodeIds: ['a'] },
            1000,
            500,
            50
        );

        expect(layout.nodes.map(n => [n.x, n.y])).toEqual([[50, 250], [500, 50], [500, 450], [950, 250]]);
    });

    it('clamps out of range positions', () => {
        const layout = layoutSectorMap(
            { nodes: [node('a', -1, 2, [])], currentNodeId: null, visitedNodeIds: [], availableNodeIds: [] },
            100,
            100,
            10
        );

        expect([layout.nodes[0].x, layout.nodes[0].y]).toEqual([10, 90]);
    });

    it('classifies nodes at the start of a sector', () => {
        const layout = layoutSectorMap(
            { nodes, currentNodeId: null, visitedNodeIds: [], availableNodeIds: ['a'] },
            100,
            100,
            0
        );

        expect(layout.nodes.map(n => n.status)).toEqual(['available', 'unreachable', 'unreachable', 'unreachable']);
        expect(layout.edges.every(edge => edge.status === 'unreachable')).toBe(true);
    });

    it('classifies nodes and edges part way through a sector', () => {
        const layout = layoutSectorMap(
            { nodes, currentNodeId: 'b', visitedNodeIds: ['a', 'b'], availableNodeIds: ['d'] },
            100,
            100,
            0
        );

        expect(layout.nodes.map(n => n.status)).toEqual(['visited', 'current', 'unreachable', 'available']);

        const statuses = Object.fromEntries(layout.edges.map(edge => [edge.id, edge.status]));
        expect(statuses).toEqual({
            'a->b': 'travelled',
            'a->c': 'unreachable',
            'b->d': 'available',
            'c->d': 'unreachable',
        });
    });

    it('skips edges to unknown nodes and tolerates an unknown current node', () => {
        const layout = layoutSectorMap(
            { nodes: [node('a', 0, 0, ['missing'])], currentNodeId: 'dev', visitedNodeIds: ['dev'], availableNodeIds: [] },
            100,
            100,
            0
        );

        expect(layout.edges).toEqual([]);
        expect(layout.nodes[0].status).toBe('unreachable');
    });
});
