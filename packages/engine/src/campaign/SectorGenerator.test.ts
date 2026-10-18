import { describe, expect, it } from 'vitest';
import { hasEncounter } from '../encounters/EncounterRegistry';
import { seededRandom } from '../testUtils';
import { generateSector, getMaxEliteCount, maxMidRepairCount, maxRouteChoices, midRepairLayers, sectorLayerCount, sectorRowCount } from './SectorGenerator';
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

    return walk(sector.startNodeId);
}

describe.each(sectorThemes.map((theme, sectorIndex) => [theme.id, theme, sectorIndex] as const))('generateSector (%s)', (_name, theme, sectorIndex) => {
    it.each(seeds)('seed %i satisfies the graph invariants', (seed) => {
        const sector = generateSector(seededRandom(seed), theme, sectorIndex);
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
            const row = node.y * (sectorRowCount - 1);
            expect(row).toBeCloseTo(Math.round(row));
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
                expect(node.next.length).toBeLessThanOrEqual(maxRouteChoices);
            }
        }

        // No orphans: everything is reachable from the start node, and only the start node has no inbound edge.
        const reachable = new Set<string>([sector.startNodeId]);
        const queue = [sector.startNodeId];
        while (queue.length > 0) {
            for (const next of nodes.get(queue.pop()!)!.next) {
                if (!reachable.has(next)) {
                    reachable.add(next);
                    queue.push(next);
                }
            }
        }

        expect(reachable.size).toBe(nodes.size);

        const hasInbound = new Set(sector.nodes.flatMap(node => [...node.next]));
        for (const node of sector.nodes) {
            expect(hasInbound.has(node.id)).toBe(node.id !== sector.startNodeId);
        }

        // The start is a repair station, alone in the first column, as the boss is in the last.
        const start = nodes.get(sector.startNodeId)!;
        expect(start.kind).toBe('repair');
        expect(start.x).toBe(0);
        expect(sector.nodes.filter(node => node.x === 0)).toEqual([start]);
    });

    it.each(seeds)('seed %i puts each column on distinct rows, with no crossing links', (seed) => {
        const sector = generateSector(seededRandom(seed), theme, sectorIndex);
        const nodes = new Map(sector.nodes.map(node => [node.id, node]));

        for (let layer = 0; layer < sectorLayerCount; layer++) {
            const column = sector.nodes.filter(node => node.x === layer / (sectorLayerCount - 1));
            expect(new Set(column.map(node => node.y)).size).toBe(column.length);
        }

        const links = sector.nodes.flatMap(node => [...node.next].map(next => ({ x: node.x, y1: node.y, y2: nodes.get(next)!.y })));
        for (const a of links) {
            for (const b of links) {
                if (a.x === b.x && a.y1 < b.y1) {
                    expect(a.y2).toBeLessThanOrEqual(b.y2);
                }
            }
        }
    });

    it.each(seeds)('seed %i lines nodes up with the middle of their inputs', (seed) => {
        const sector = generateSector(seededRandom(seed), theme, sectorIndex);
        const inputs = new Map(sector.nodes.map(node => [node.id, sector.nodes.filter(other => other.next.includes(node.id))]));

        /** Level with the middle one of an odd number of rows, or between the middle two of an even number. */
        const expectAmongMiddle = (y: number, linked: SectorInfo['nodes']) => {
            const sorted = linked.map(node => node.y).sort((a, b) => a - b);
            expect(y).toBeGreaterThanOrEqual(sorted[Math.floor((sorted.length - 1) / 2)]);
            expect(y).toBeLessThanOrEqual(sorted[Math.ceil((sorted.length - 1) / 2)]);
        };

        for (const node of sector.nodes) {
            const nodeInputs = inputs.get(node.id)!;

            // A node branching off from a single input can't always be level with it; its input sits among its branches instead.
            if (nodeInputs.length > 1 || (nodeInputs.length === 1 && nodeInputs[0].next.length === 1)) {
                expectAmongMiddle(node.y, nodeInputs);
            }
            if (node.next.length > 1) {
                expectAmongMiddle(node.y, sector.nodes.filter(other => node.next.includes(other.id)));
            }
        }
    });

    it.each(seeds)('seed %i starts every path at a repair station, and ends it with another then the boss', (seed) => {
        const sector = generateSector(seededRandom(seed), theme, sectorIndex);
        const nodes = new Map(sector.nodes.map(node => [node.id, node]));
        const paths = enumeratePaths(sector);

        expect(paths.length).toBeGreaterThan(1);

        for (const path of paths) {
            expect(path).toHaveLength(sectorLayerCount);
            expect(path.at(-1)).toBe(sector.bossNodeId);

            const kinds = path.map(id => nodes.get(id)!.kind);
            expect(kinds[0]).toBe('repair');
            expect(kinds.at(-2)).toBe('repair');
        }

        // The graph is bigger than any one path, so there are real choices.
        expect(sector.nodes.length).toBeGreaterThan(sectorLayerCount + 2);
    });

    it.each(seeds)('seed %i scatters repair stations that routes can avoid, and elite encounters, never back to back', (seed) => {
        const sector = generateSector(seededRandom(seed), theme, sectorIndex);
        const nodes = new Map(sector.nodes.map(node => [node.id, node]));
        const paths = enumeratePaths(sector);
        const layerOf = (id: string) => Math.round(nodes.get(id)!.x * (sectorLayerCount - 1));

        const midRepairs = sector.nodes.filter(node => node.kind === 'repair' && layerOf(node.id) > 0 && layerOf(node.id) < sectorLayerCount - 2);
        const elites = sector.nodes.filter(node => node.elite);

        expect(midRepairs.length).toBeGreaterThan(0);
        expect(midRepairs.length).toBeLessThanOrEqual(maxMidRepairCount);
        expect(elites.length).toBeGreaterThan(0);
        expect(elites.length).toBeLessThanOrEqual(getMaxEliteCount(sectorIndex));

        for (const repair of midRepairs) {
            expect(layerOf(repair.id)).toBeGreaterThanOrEqual(midRepairLayers.first);
            expect(layerOf(repair.id)).toBeLessThanOrEqual(midRepairLayers.last);
        }

        for (const elite of elites) {
            expect(elite.kind).toBe('combat');
        }

        // No two repair stations or elites back to back.
        for (const optional of [midRepairs, elites]) {
            const ids = new Set(optional.map(node => node.id));
            for (const node of optional) {
                expect(node.next.some(next => ids.has(next))).toBe(false);
            }
        }

        // Some route avoids every mid-sector repair station, though elites may be unavoidable.
        const midRepairIds = new Set(midRepairs.map(node => node.id));
        expect(paths.some(path => path.every(id => !midRepairIds.has(id)))).toBe(true);

        for (const path of paths) {
            const kinds = path.map(id => nodes.get(id)!.kind);
            expect(kinds.some((kind, index) => kind === 'repair' && kinds[index + 1] === 'repair')).toBe(false);
        }
    });

    it.each(seeds)('seed %i gives every node coherent per-node data', (seed) => {
        const sector = generateSector(seededRandom(seed), theme, sectorIndex);

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

    it.each(seeds)('seed %i only offers choices that each have something the others lack, in what the map shows', (seed) => {
        const sector = generateSector(seededRandom(seed), theme, sectorIndex);
        const nodes = new Map(sector.nodes.map(node => [node.id, node]));
        const symbolOf = (node: SectorInfo['nodes'][number]) => (node.elite ? 'elite' : node.kind);

        /** Every sequence of node types the map shows on the way from a node to the boss. */
        const getFutures = (id: string) => new Set(enumeratePaths({ ...sector, startNodeId: id })
            .map(path => path.map(pathId => symbolOf(nodes.get(pathId)!)).join(',')));

        for (const node of sector.nodes) {
            const choices = node.next.map(getFutures);
            choices.forEach((futures, index) => {
                for (const other of choices.filter((_, otherIndex) => otherIndex !== index)) {
                    expect([...futures].some(future => !other.has(future))).toBe(true);
                }
            });
        }
    });

    it('sometimes lets a route visit both mid-sector repair stations', () => {
        const visitsBoth = seeds.some((seed) => {
            const sector = generateSector(seededRandom(seed), theme, sectorIndex);
            const nodes = new Map(sector.nodes.map(node => [node.id, node]));
            return enumeratePaths(sector).some(path => path.slice(1, -2).filter(id => nodes.get(id)!.kind === 'repair').length === 2);
        });

        expect(visitsBoth).toBe(true);
    });

    it('is deterministic for a seed and varies between seeds', () => {
        const first = generateSector(seededRandom(7), theme, sectorIndex);
        expect(generateSector(seededRandom(7), theme, sectorIndex)).toEqual(first);

        const layouts = new Set(seeds.map(seed => JSON.stringify(generateSector(seededRandom(seed), theme, sectorIndex).nodes)));
        expect(layouts.size).toBeGreaterThan(1);
    });
});

describe('generateSector across sectors', () => {
    it('puts more elites in later sectors', () => {
        const averageElites = sectorThemes.map((theme, sectorIndex) => {
            const counts = seeds.map(seed => generateSector(seededRandom(seed), theme, sectorIndex).nodes.filter(node => node.elite).length);
            return counts.reduce((sum, count) => sum + count, 0) / counts.length;
        });

        for (let sectorIndex = 1; sectorIndex < averageElites.length; sectorIndex++) {
            expect(averageElites[sectorIndex]).toBeGreaterThan(averageElites[sectorIndex - 1]);
        }
    });
});
