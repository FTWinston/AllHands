import { describe, expect, it } from 'vitest';
import { getEdgePath, layoutSectorMap } from './layoutSectorMap';
import type { SectorMapNodeInfo } from 'common-data/features/sectors/types/SectorMapInfo';

function node(id: string, x: number, y: number, next: string[], kind: SectorMapNodeInfo['kind'] = 'combat'): SectorMapNodeInfo {
    return { id, kind, name: id, elite: false, x, y, next };
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
            { nodes, currentNodeId: 'a', visitedNodeIds: ['a'], availableNodeIds: ['b', 'c'] },
            1000,
            500,
            50
        );

        expect(layout.nodes.map(n => [n.x, n.y])).toEqual([[50, 250], [500, 50], [500, 450], [950, 250]]);
    });

    it('clamps out of range positions', () => {
        const layout = layoutSectorMap(
            { nodes: [node('a', -1, 2, [])], currentNodeId: 'a', visitedNodeIds: ['a'], availableNodeIds: [] },
            100,
            100,
            10
        );

        expect([layout.nodes[0].x, layout.nodes[0].y]).toEqual([10, 90]);
    });

    it('classifies nodes at the start of a sector', () => {
        const layout = layoutSectorMap(
            { nodes, currentNodeId: 'a', visitedNodeIds: ['a'], availableNodeIds: ['b', 'c'] },
            100,
            100,
            0
        );

        expect(layout.nodes.map(n => n.status)).toEqual(['current', 'available', 'available', 'unreachable']);

        const statuses = Object.fromEntries(layout.edges.map(edge => [edge.id, edge.status]));
        expect(statuses).toEqual({
            'a->b': 'available',
            'a->c': 'available',
            'b->d': 'unreachable',
            'c->d': 'unreachable',
        });
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

    it('turns every edge between two columns at the same point', () => {
        const layout = layoutSectorMap(
            {
                nodes: [
                    node('a0', 0, 0, ['b1']),
                    node('a3', 0, 0.5, ['b1', 'b3', 'b5']),
                    node('a6', 0, 1, ['b5']),
                    node('b1', 0.5, 1 / 6, ['c3']),
                    node('b3', 0.5, 0.5, ['c3']),
                    node('b5', 0.5, 5 / 6, ['c3']),
                    node('c3', 1, 0.5, []),
                ],
                currentNodeId: 'a3',
                visitedNodeIds: ['a3'],
                availableNodeIds: [],
            },
            200,
            600,
            0
        );

        const bends = (fromX: number) => new Set(layout.edges.filter(edge => edge.x1 === fromX).map(edge => edge.bendX));

        expect(bends(0)).toEqual(new Set([45]));
        expect(bends(100)).toEqual(new Set([145]));
    });
});

describe('getEdgePath', () => {
    it('draws a straight line between nodes on the same row', () => {
        expect(getEdgePath({ y1: 50, y2: 50, bendX: 30 }, 10, 90, 8)).toBe('M10 50H90');
    });

    it('turns down and back with rounded corners', () => {
        expect(getEdgePath({ y1: 0, y2: 100, bendX: 50 }, 10, 90, 8)).toBe('M10 0H42A8 8 0 0 1 50 8V92A8 8 0 0 0 58 100H90');
    });

    it('turns up and back, with corners no bigger than the turn allows', () => {
        expect(getEdgePath({ y1: 10, y2: 0, bendX: 50 }, 10, 90, 8)).toBe('M10 10H45A5 5 0 0 0 50 5V5A5 5 0 0 1 55 0H90');
    });
});
