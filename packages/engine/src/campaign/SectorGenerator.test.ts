import { isShopStationKind, isStationKind, shopStationKinds } from 'common-data/features/sectors/utils/isStationKind';
import { describe, expect, it } from 'vitest';
import { hasEncounter, stationEncounterIds } from '../encounters/EncounterRegistry';
import { seededRandom } from '../testUtils';
import { generateSector, getMaxEliteCount, maxMidStationCount, maxRouteChoices, midStationLayers, minShopStationsPerRoute, sectorLayerCount, sectorRowCount } from './SectorGenerator';
import { sectorThemes } from './sectorThemes';
import type { SectorInfo } from 'common-data/features/sectors/types/SectorInfo';

const seeds = Array.from({ length: 40 }, (_, i) => i + 1);

const generatedSectors = new Map<string, SectorInfo>();

/** Generating a sector takes a while, so tests share each one. None of them changes it. */
function getSector(seed: number, sectorIndex: number): SectorInfo {
    const key = `${sectorIndex}:${seed}`;
    if (!generatedSectors.has(key)) {
        generatedSectors.set(key, generateSector(seededRandom(seed), sectorThemes[sectorIndex], sectorIndex));
    }

    return generatedSectors.get(key)!;
}

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
        const sector = getSector(seed, sectorIndex);
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
        const sector = getSector(seed, sectorIndex);
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
        const sector = getSector(seed, sectorIndex);
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
        const sector = getSector(seed, sectorIndex);
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

    it.each(seeds)('seed %i scatters shop stations and elite encounters, never back to back', (seed) => {
        const sector = getSector(seed, sectorIndex);
        const nodes = new Map(sector.nodes.map(node => [node.id, node]));
        const paths = enumeratePaths(sector);
        const layerOf = (id: string) => Math.round(nodes.get(id)!.x * (sectorLayerCount - 1));

        const midStations = sector.nodes.filter(node => isStationKind(node.kind) && layerOf(node.id) > 0 && layerOf(node.id) < sectorLayerCount - 2);
        const elites = sector.nodes.filter(node => node.elite);

        expect(midStations.length).toBeGreaterThan(0);
        expect(midStations.length).toBeLessThanOrEqual(maxMidStationCount);
        expect(elites.length).toBeGreaterThan(0);
        expect(elites.length).toBeLessThanOrEqual(getMaxEliteCount(sectorIndex));

        for (const station of midStations) {
            expect(isShopStationKind(station.kind)).toBe(true);
            expect(layerOf(station.id)).toBeGreaterThanOrEqual(midStationLayers.first);
            expect(layerOf(station.id)).toBeLessThanOrEqual(midStationLayers.last);
        }

        for (const elite of elites) {
            expect(elite.kind).toBe('combat');
        }

        // No two elites back to back, nor two stations of any kind.
        const eliteIds = new Set(elites.map(node => node.id));
        for (const elite of elites) {
            expect(elite.next.some(next => eliteIds.has(next))).toBe(false);
        }

        for (const path of paths) {
            const kinds = path.map(id => nodes.get(id)!.kind);
            expect(kinds.some((kind, index) => isStationKind(kind) && isStationKind(kinds[index + 1]))).toBe(false);
        }
    });

    it.each(seeds)('seed %i offers more shop stations than any route can visit', (seed) => {
        const sector = getSector(seed, sectorIndex);
        const nodes = new Map(sector.nodes.map(node => [node.id, node]));
        const shopCounts = enumeratePaths(sector).map(path => path.filter(id => isShopStationKind(nodes.get(id)!.kind)).length);
        const shops = sector.nodes.filter(node => isShopStationKind(node.kind));

        // Stations are never back to back, and only go in five layers, so no route visits more than three.
        expect(Math.max(...shopCounts)).toBeLessThanOrEqual(3);
        expect(shops.length).toBeGreaterThan(Math.max(...shopCounts));
        expect(new Set(shops.map(node => node.kind)).size).toBeGreaterThan(1);
    });

    it.each(seeds)('seed %i gives every node coherent per-node data', (seed) => {
        const sector = getSector(seed, sectorIndex);

        for (const node of sector.nodes) {
            expect(node.name.length).toBeGreaterThan(0);

            if (isStationKind(node.kind)) {
                expect(node.objective).toBeUndefined();
                expect(node.factionId).toBeUndefined();
                expect(node.encounterId).toBe(stationEncounterIds[node.kind]);
                expect(theme.stationNames[node.kind]).toContain(node.name);
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
        const sector = getSector(seed, sectorIndex);
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

    describe('across seeds', () => {
        const getSectors = () => seeds.map(seed => getSector(seed, sectorIndex));

        it('usually lets a route visit two or three shop stations, sometimes three', () => {
            const shopCounts = getSectors().flatMap((sector) => {
                const nodes = new Map(sector.nodes.map(node => [node.id, node]));
                return enumeratePaths(sector).map(path => path.filter(id => isShopStationKind(nodes.get(id)!.kind)).length);
            });

            const twoOrThree = shopCounts.filter(count => count >= minShopStationsPerRoute && count <= 3).length;
            expect(twoOrThree / shopCounts.length).toBeGreaterThan(0.85);
            expect(shopCounts).toContain(3);
        });

        it('usually offers a choice between different kinds of shop', () => {
            const offersShopChoice = getSectors().filter((sector) => {
                const nodes = new Map(sector.nodes.map(node => [node.id, node]));
                return sector.nodes.some(node => new Set(node.next.map(id => nodes.get(id)!.kind).filter(isShopStationKind)).size > 1);
            });

            expect(offersShopChoice.length / seeds.length).toBeGreaterThan(0.8);
        });

        it('keeps choices of route that differ only in which kind of shop they pass', () => {
            // Were every kind of station the same, some choices would offer nothing the others don't. They're real choices, so are kept.
            const differsOnlyByShopKind = getSectors().some((sector) => {
                const nodes = new Map(sector.nodes.map(node => [node.id, node]));
                const symbolOf = (node: SectorInfo['nodes'][number]) => (node.elite ? 'elite' : isStationKind(node.kind) ? 'station' : node.kind);
                const getFutures = (id: string) => new Set(enumeratePaths({ ...sector, startNodeId: id })
                    .map(path => path.map(pathId => symbolOf(nodes.get(pathId)!)).join(',')));

                return sector.nodes.some((node) => {
                    const choices = node.next.map(getFutures);
                    return choices.some((futures, index) => choices.some((other, otherIndex) =>
                        otherIndex !== index && [...futures].every(future => other.has(future))));
                });
            });

            expect(differsOnlyByShopKind).toBe(true);
        });

        it('keeps the start and pre-boss stations as repair stations, while mid-sector stations are shops of every kind', () => {
            const midKinds = new Set<string>();

            for (const sector of getSectors()) {
                for (const node of sector.nodes.filter(node => isStationKind(node.kind))) {
                    const layer = Math.round(node.x * (sectorLayerCount - 1));
                    if (layer === 0 || layer === sectorLayerCount - 2) {
                        expect(node.kind).toBe('repair');
                    } else {
                        midKinds.add(node.kind);
                    }
                }
            }

            expect([...midKinds].sort()).toEqual([...shopStationKinds].sort());
        });
    });

    it('is deterministic for a seed and varies between seeds', () => {
        const first = generateSector(seededRandom(7), theme, sectorIndex);
        expect(generateSector(seededRandom(7), theme, sectorIndex)).toEqual(first);

        const layouts = new Set(seeds.map(seed => JSON.stringify(getSector(seed, sectorIndex).nodes)));
        expect(layouts.size).toBeGreaterThan(1);
    });
});

describe('generateSector across sectors', () => {
    it('puts more elites in later sectors', () => {
        const averageElites = sectorThemes.map((_theme, sectorIndex) => {
            const counts = seeds.map(seed => getSector(seed, sectorIndex).nodes.filter(node => node.elite).length);
            return counts.reduce((sum, count) => sum + count, 0) / counts.length;
        });

        for (let sectorIndex = 1; sectorIndex < averageElites.length; sectorIndex++) {
            expect(averageElites[sectorIndex]).toBeGreaterThan(averageElites[sectorIndex - 1]);
        }
    });
});
