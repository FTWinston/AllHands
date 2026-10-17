import { getEncounterDefinition } from '../encounters/EncounterRegistry';
import type { SectorTheme } from './sectorThemes';
import type { ObjectiveInfo } from 'common-data/features/sectors/types/ObjectiveInfo';
import type { SectorInfo } from 'common-data/features/sectors/types/SectorInfo';
import type { EncounterId, SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { IRandom } from 'common-data/types/IRandom';

/** A node while it is being built, before its links are fixed. */
type MutableNode = Omit<SectorNodeInfo, 'next'> & { next: string[] };

/** Layers 0..8; every path visits one node per layer. */
export const sectorLayerCount = 9;
const midRepairLayer = 4;
const preBossRepairLayer = sectorLayerCount - 2;
const bossLayer = sectorLayerCount - 1;

const easyEncounters: readonly EncounterId[] = ['skirmish', 'ambush', 'survive'];
const hardEncounters: readonly EncounterId[] = ['assault', 'escort', 'survive', 'ambush'];
const easyLayerCount = 3;
const surviveDurationsMs = [45_000, 60_000, 75_000];

/** Chance that a node also links to the neighbour of the node it would normally link to. */
const extraLinkChance = 0.35;

/**
 * Builds a layered, branching DAG: every node leads onward, every node can be reached from a start node,
 * every path crosses a repair layer halfway and another just before the single boss node.
 */
export function generateSector(random: IRandom, theme: SectorTheme): SectorInfo {
    const layerSizes = Array.from({ length: sectorLayerCount }, (_, layer) => getLayerSize(random, layer));
    const names = createNamePicker(random, theme);

    const layers: MutableNode[][] = layerSizes.map((size, layer) =>
        Array.from({ length: size }, (_, index) => createNode(random, theme, names, layer, index, size))
    );

    for (let layer = 0; layer < bossLayer; layer++) {
        linkLayers(random, layers[layer], layers[layer + 1]);
    }

    return {
        id: theme.id,
        name: theme.name,
        introMessage: theme.introMessage,
        outroMessage: theme.outroMessage,
        defeatMessage: theme.defeatMessage,
        nodes: layers.flat(),
        startNodeIds: layers[0].map(node => node.id),
        bossNodeId: layers[bossLayer][0].id,
    };
}

function getLayerSize(random: IRandom, layer: number): number {
    if (layer === bossLayer) {
        return 1;
    }

    if (layer === preBossRepairLayer) {
        return 1;
    }

    // The mid repair layer is made entirely of repair nodes, so that every path passes through one.
    return layer === midRepairLayer ? 1 + random.getInt(2) : 2 + random.getInt(3);
}

function createNode(random: IRandom, theme: SectorTheme, names: NamePicker, layer: number, index: number, layerSize: number): MutableNode {
    const base = {
        id: `${theme.id}-${layer}-${index}`,
        x: layer / (sectorLayerCount - 1),
        y: getLayoutY(random, index, layerSize),
        next: [] as string[],
    };

    if (layer === bossLayer) {
        const definition = getEncounterDefinition(theme.bossEncounterId);
        return {
            ...base,
            kind: 'boss',
            encounterId: definition.id,
            name: definition.name,
            environment: random.pick(theme.environments),
            factionId: theme.factionId,
            objective: definition.objective,
        };
    }

    if (layer === midRepairLayer || layer === preBossRepairLayer) {
        const definition = getEncounterDefinition('repairStation');
        return {
            ...base,
            kind: 'repair',
            encounterId: definition.id,
            name: names.pickStation(),
        };
    }

    const encounterId = random.pick(layer < easyLayerCount ? easyEncounters : hardEncounters);
    const definition = getEncounterDefinition(encounterId);

    return {
        ...base,
        kind: 'combat',
        encounterId,
        name: names.pickLocation(),
        environment: random.pick(theme.environments),
        factionId: theme.factionId,
        objective: createObjective(random, definition.objective),
    };
}

function createObjective(random: IRandom, objective: ObjectiveInfo | undefined): ObjectiveInfo | undefined {
    if (objective?.type === 'survive') {
        return { type: 'survive', durationMs: random.pick(surviveDurationsMs) };
    }

    return objective;
}

/** Spreads nodes down the layer in 0.1..0.9, with a little jitter so the map doesn't look like a grid. */
function getLayoutY(random: IRandom, index: number, layerSize: number): number {
    if (layerSize === 1) {
        return 0.5;
    }

    const evenlySpaced = 0.1 + (0.8 * index) / (layerSize - 1);
    return Math.min(0.9, Math.max(0.1, evenlySpaced + random.getFloat(-0.04, 0.04)));
}

/**
 * Links each node to the proportionally-aligned node in the next layer (plus occasionally its neighbour),
 * then gives any node left without an incoming link one, so nothing is orphaned.
 */
function linkLayers(random: IRandom, from: MutableNode[], to: MutableNode[]) {
    const map = (index: number, fromSize: number, toSize: number) =>
        fromSize === 1 ? 0 : Math.round((index * (toSize - 1)) / (fromSize - 1));

    const link = (source: MutableNode, targetIndex: number) => {
        const targetId = to[targetIndex].id;
        if (!source.next.includes(targetId)) {
            source.next.push(targetId);
        }
    };

    from.forEach((source, index) => {
        const target = map(index, from.length, to.length);
        link(source, target);

        if (to.length > 1 && random.getBoolean(extraLinkChance)) {
            const neighbour = target === 0 ? 1 : target === to.length - 1 ? target - 1 : target + (random.getBoolean(0.5) ? 1 : -1);
            link(source, neighbour);
        }
    });

    to.forEach((target, index) => {
        if (!from.some(source => source.next.includes(target.id))) {
            link(from[map(index, to.length, from.length)], index);
        }
    });

    for (const source of from) {
        source.next.sort();
    }
}

interface NamePicker {
    pickLocation(): string;
    pickStation(): string;
}

/** Picks names without repeats while any remain. */
function createNamePicker(random: IRandom, theme: SectorTheme): NamePicker {
    const pickFrom = (names: readonly string[]) => {
        let pool = [...names];
        return () => {
            if (pool.length === 0) {
                pool = [...names];
            }

            return random.delete(pool);
        };
    };

    return {
        pickLocation: pickFrom(theme.locationNames),
        pickStation: pickFrom(theme.stationNames),
    };
}
