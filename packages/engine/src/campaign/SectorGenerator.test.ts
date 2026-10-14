import { describe, expect, it } from 'vitest';
import { hasEncounter } from '../encounters/EncounterRegistry';
import { seededRandom } from '../testUtils';
import { generateSector, sectorLayerCount } from './SectorGenerator';
import { sectorThemes } from './sectorThemes';
import type { SectorInfo } from 'common-data/features/sectors/types/SectorInfo';

const seeds = Array.from({ length: 40 }, (_, i) => i + 1);

/** All start-to-boss paths, as arrays of node ids. */
function enumeratePaths(sector: SectorInfo): string[][] {
    const nodes = new Map(sector.nodes.map(node => [node.id, node]));
    const walk = (id: string): string[][] => {
        const node = nodes.get(id)!;
        return node.next.length === 0 ? [[id]] : node.next.flatMap(next => walk(next).map(path => [id, ...path]));
    };

    return sector.startNodeIds.flatMap(walk);
}

describe.each(sectorThemes.map(theme => [theme.id, theme] as const))('generateSector (%s)', (_name, theme) => {
    it.each(seeds)('seed %i satisfies the graph invariants', (seed) => {
        const sector = generateSector(seededRandom(seed), theme);
        const nodes = new Map(sector.nodes.map(node => [node.id, node]));

        expect(nodes.size).toBe(sector.nodes.length);
        expect(sector.name).toBe(theme.name);
        expect(sector.introMessage.length).toBeGreaterThan(0);
        expect(sector.outroMessage.length).toBeGreaterThan(0);

        // Edges point at real nodes, and always run left to right.
        for (const node of sector.nodes) {
            for (const next of node.next) {
                expect(nodes.has(next)).toBe(true);
                expect(nodes.get(next)!.x).toBeGreaterThan(node.x);
            }

            expect(node.x).toBeGreaterThanOrEqual(0);
            expect(node.x).toBeLessThanOrEqual(1);
            expect(node.y).toBeGreaterThanOrEqual(0);
            expect(node.y).toBeLessThanOrEqual(1);
            expect(hasEncounter(node.encounterId)).toBe(true);
        }

        // A single boss, last, with nothing after it; everything else leads onward.
        const bosses = sector.nodes.filter(node => node.kind === 'boss');
        expect(bosses.map(node => node.id)).toEqual([sector.bossNodeId]);
        expect(nodes.get(sector.bossNodeId)!.next).toEqual([]);
        expect(nodes.get(sector.bossNodeId)!.x).toBe(1);
        expect(nodes.get(sector.bossNodeId)!.encounterId).toBe(theme.bossEncounterId);
        for (const node of sector.nodes) {
            if (node.id !== sector.bossNodeId) {
                expect(node.next.length).toBeGreaterThan(0);
            }
        }

        // No orphans: everything is reachable from a start node, and only start nodes have no inbound edge.
        const reachable = new Set<string>(sector.startNodeIds);
        const queue = [...sector.startNodeIds];
        while (queue.length > 0) {
            for (const next of nodes.get(queue.pop()!)!.next) {
                if (!reachable.has(next)) {
                    reachable.add(next);
                    queue.push(next);
                }
            }
        }

        expect(reachable.size).toBe(nodes.size);

        const hasInbound = new Set(sector.nodes.flatMap(node => node.next));
        for (const node of sector.nodes) {
            expect(hasInbound.has(node.id) || sector.startNodeIds.includes(node.id)).toBe(true);
        }

        for (const start of sector.startNodeIds) {
            expect(nodes.get(start)!.x).toBe(0);
        }
    });

    it.each(seeds)('seed %i puts the repair stops and boss on every path', (seed) => {
        const sector = generateSector(seededRandom(seed), theme);
        const nodes = new Map(sector.nodes.map(node => [node.id, node]));
        const paths = enumeratePaths(sector);

        expect(paths.length).toBeGreaterThan(1);

        for (const path of paths) {
            expect(path).toHaveLength(sectorLayerCount);
            expect(path.at(-1)).toBe(sector.bossNodeId);

            const kinds = path.map(id => nodes.get(id)!.kind);
            expect(kinds.filter(kind => kind === 'repair')).toHaveLength(2);
            expect(kinds.at(-2)).toBe('repair');

            // The other repair node sits roughly halfway.
            const middleRepair = kinds.indexOf('repair');
            expect(Math.abs(middleRepair - (path.length - 1) / 2)).toBeLessThanOrEqual(1);
        }

        // The graph is bigger than any one path, so there are real choices.
        expect(sector.nodes.length).toBeGreaterThan(sectorLayerCount + 2);
    });

    it.each(seeds)('seed %i gives every node coherent per-node data', (seed) => {
        const sector = generateSector(seededRandom(seed), theme);

        for (const node of sector.nodes) {
            expect(node.name.length).toBeGreaterThan(0);

            if (node.kind === 'repair') {
                expect(node.objective).toBeUndefined();
                expect(node.factionId).toBeUndefined();
                expect(node.encounterId).toBe('repairStation');
            } else {
                expect(node.environment).toBeDefined();
                expect(node.factionId).toBe(theme.factionId);
                expect(node.objective).toBeDefined();
            }

            if (node.kind === 'boss') {
                expect(node.objective).toEqual({ type: 'boss' });
            } else if (node.encounterId === 'survive') {
                expect(node.objective).toMatchObject({ type: 'survive' });
                expect((node.objective as { durationMs: number }).durationMs).toBeGreaterThan(0);
            } else if (node.kind === 'combat') {
                expect(node.objective).toEqual({ type: 'destroyAll' });
            }
        }
    });

    it('is deterministic for a seed and varies between seeds', () => {
        const first = generateSector(seededRandom(7), theme);
        expect(generateSector(seededRandom(7), theme)).toEqual(first);

        const layouts = new Set(seeds.map(seed => JSON.stringify(generateSector(seededRandom(seed), theme).nodes)));
        expect(layouts.size).toBeGreaterThan(1);
    });
});
