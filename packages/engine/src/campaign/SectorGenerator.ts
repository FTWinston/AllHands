import { getEncounterDefinition } from '../encounters/EncounterRegistry';
import type { SectorTheme } from './sectorThemes';
import type { ObjectiveInfo } from 'common-data/features/sectors/types/ObjectiveInfo';
import type { SectorInfo } from 'common-data/features/sectors/types/SectorInfo';
import type { EncounterId, SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { IRandom } from 'common-data/types/IRandom';

/** A node while it is being built, before its links are fixed. */
type MutableNode = Omit<SectorNodeInfo, 'next'> & { next: string[] };

/** Layers 0..9; every path visits one node per layer, starting from the single repair station in layer 0. */
export const sectorLayerCount = 10;
const startLayer = 0;
const midRepairLayer = 4;
const preBossRepairLayer = sectorLayerCount - 2;
const bossLayer = sectorLayerCount - 1;

const easyEncounters: readonly EncounterId[] = ['skirmish', 'ambush', 'survive'];
const hardEncounters: readonly EncounterId[] = ['assault', 'escort', 'survive', 'ambush'];
/** Combat layers 1..easyLayerCount use the easier encounters. */
const easyLayerCount = 3;
const surviveDurationsMs = [45_000, 60_000, 75_000];

/** Nodes sit on one of this many evenly spaced rows. The start and boss nodes prefer the middle one. */
export const sectorRowCount = 7;
const middleRow = (sectorRowCount - 1) / 2;

/** Encounter layers hold between 2 and this many nodes. */
const maxLayerSize = 5;

/** The most links any node has onward, so the most routes helm can choose between. */
export const maxRouteChoices = 3;

/** Chance that a step of the linking walk is split in two, adding a branching or converging link. */
const extraLinkChance = 0.35;

/**
 * Cost per row a node sits away from where its links say it should be. Each row a link climbs or drops costs 1, to keep the map compact.
 * Misalignment outweighs all of those and `offCentreCost` put together.
 */
const misalignmentCost = 10_000;
/** Cost per row the start or boss node sits away from the middle, outweighing all the links' climbs and drops. */
const offCentreCost = 1_000;
/** Up to this much random cost is added to each possible arrangement of a layer, to vary between equally good layouts. */
const arrangementJitter = 0.5;

/**
 * Builds a layered, branching DAG with no crossing links: every node leads onward, every node can be reached from the start repair station,
 * every path crosses a repair layer halfway and another just before the single boss node.
 */
export function generateSector(random: IRandom, theme: SectorTheme): SectorInfo {
    // Sized from the boss back, as the mid repair layer's size depends on the layer after it.
    const layerSizes: number[] = [];
    for (let layer = bossLayer; layer >= 0; layer--) {
        layerSizes[layer] = getLayerSize(random, layer, layerSizes[layer + 1]);
    }

    const names = createNamePicker(random, theme);

    const layers: MutableNode[][] = layerSizes.map((size, layer) =>
        Array.from({ length: size }, (_, index) => createNode(random, theme, names, layer, index))
    );

    for (let layer = 0; layer < bossLayer; layer++) {
        linkLayers(random, layers[layer], layers[layer + 1]);
    }

    const rows = arrangeRows(random, layers);
    layers.forEach((nodes, layer) => nodes.forEach((node, index) => {
        node.y = rows[layer][index] / (sectorRowCount - 1);
    }));

    return {
        id: theme.id,
        name: theme.name,
        introMessage: theme.introMessage,
        outroMessage: theme.outroMessage,
        defeatMessage: theme.defeatMessage,
        nodes: layers.flat(),
        startNodeId: layers[startLayer][0].id,
        bossNodeId: layers[bossLayer][0].id,
    };
}

function getLayerSize(random: IRandom, layer: number, nextLayerSize: number): number {
    if (layer === startLayer || layer === preBossRepairLayer || layer === bossLayer) {
        return 1;
    }

    // The mid repair layer is made entirely of repair nodes, so that every path passes through one.
    // A second one is only added when the next layer has more routes than one could offer.
    if (layer === midRepairLayer) {
        return Math.ceil(nextLayerSize / maxRouteChoices);
    }

    // The layer after the single start node can only be as big as its choice of routes.
    const maxSize = layer === startLayer + 1 ? maxRouteChoices : maxLayerSize;
    return 2 + random.getInt(maxSize - 1);
}

function createNode(random: IRandom, theme: SectorTheme, names: NamePicker, layer: number, index: number): MutableNode {
    const base = {
        id: `${theme.id}-${layer}-${index}`,
        x: layer / (sectorLayerCount - 1),
        // Set once the rows are arranged.
        y: 0,
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

    if (layer === startLayer || layer === midRepairLayer || layer === preBossRepairLayer) {
        const definition = getEncounterDefinition('repairStation');
        return {
            ...base,
            kind: 'repair',
            encounterId: definition.id,
            name: names.pickStation(),
        };
    }

    const encounterId = random.pick(layer <= easyLayerCount ? easyEncounters : hardEncounters);
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

/**
 * Links two layers with a walk from their top nodes to their bottom nodes that keeps the layers' progress in step,
 * so every node gets a link in each direction and no two links cross. Occasionally a step is split in two, adding a branch.
 * Only a single node can be left with more than `maxRouteChoices` links, so `getLayerSize` keeps the layers after those small enough.
 */
function linkLayers(random: IRandom, from: MutableNode[], to: MutableNode[]) {
    let fromIndex = 0;
    let toIndex = 0;
    from[0].next.push(to[0].id);

    while (fromIndex < from.length - 1 || toIndex < to.length - 1) {
        const canAdvanceFrom = fromIndex < from.length - 1;
        const canAdvanceTo = toIndex < to.length - 1;

        // Negative when advancing in the from layer would leave it further behind than advancing in the to layer, cross-multiplied to stay in integers.
        const lead = (fromIndex + 1) * (to.length - 1) - (toIndex + 1) * (from.length - 1);
        let advanceFrom = canAdvanceFrom && (!canAdvanceTo || lead <= 0);
        let advanceTo = canAdvanceTo && (!canAdvanceFrom || lead >= 0);

        if (advanceFrom && advanceTo && random.getBoolean(extraLinkChance)) {
            if (random.getBoolean(0.5)) {
                advanceFrom = false;
            } else {
                advanceTo = false;
            }
        }

        // Move on from a node once it has as many links as it may.
        if (canAdvanceFrom && from[fromIndex].next.length >= maxRouteChoices) {
            advanceFrom = true;
        }

        if (advanceFrom) {
            fromIndex++;
        }
        if (advanceTo) {
            toIndex++;
        }

        from[fromIndex].next.push(to[toIndex].id);
    }
}

/** How far `row` is from the middle of `linkedRows`: level with the middle one of an odd number, or between the middle two of an even number. */
function getMisalignment(row: number, linkedRows: number[]): number {
    const sorted = [...linkedRows].sort((a, b) => a - b);
    const lower = sorted[Math.floor((sorted.length - 1) / 2)];
    const upper = sorted[Math.ceil((sorted.length - 1) / 2)];
    return Math.max(0, lower - row, row - upper);
}

/** Every way of placing `count` nodes on distinct rows, top to bottom. */
function getRowChoices(count: number, firstRow = 0): number[][] {
    if (count === 0) {
        return [[]];
    }

    const choices: number[][] = [];
    for (let row = firstRow; row <= sectorRowCount - count; row++) {
        for (const rest of getRowChoices(count - 1, row + 1)) {
            choices.push([row, ...rest]);
        }
    }

    return choices;
}

/**
 * Picks distinct rows for each layer's nodes, top to bottom, so that each node lines up with its links. A node with several inputs
 * sits level with the middle one (or between the middle two), as does a node with a single input that leads nowhere else.
 * A node with several outputs likewise sits among them, since its outputs can't all be level with it.
 * The start and boss nodes would rather be on the middle row, but can't always be when wide layers leave too few rows to line up the rest.
 * Every cost involves only adjacent layers, so the best arrangement is found exactly, one layer at a time.
 */
function arrangeRows(random: IRandom, layers: MutableNode[][]): number[][] {
    const indexes = new Map(layers.flatMap(nodes => nodes.map((node, index) => [node.id, index] as const)));
    const outputs = layers.map(nodes => nodes.map(node => node.next.map(id => indexes.get(id)!)));

    /** The cost of the links from `layer`, on `fromRows`, to the next layer, on `toRows`. */
    const getLinkCost = (layer: number, fromRows: number[], toRows: number[]) => {
        let cost = 0;

        outputs[layer].forEach((next, from) => {
            if (next.length > 1) {
                cost += misalignmentCost * getMisalignment(fromRows[from], next.map(to => toRows[to]));
            }
        });

        toRows.forEach((row, to) => {
            const inputs = outputs[layer].flatMap((next, from) => (next.includes(to) ? [from] : []));
            const isBranch = inputs.length === 1 && outputs[layer][inputs[0]].length > 1;
            const inputRows = inputs.map(from => fromRows[from]);

            if (!isBranch) {
                cost += misalignmentCost * getMisalignment(row, inputRows);
            }

            for (const inputRow of inputRows) {
                cost += Math.abs(row - inputRow);
            }
        });

        return cost;
    };

    const choices = layers.map(nodes => getRowChoices(nodes.length));

    /** The cost of a layer's own position, plus a little noise. */
    const getPlacementCost = (layer: number, rows: number[]) => {
        const offCentre = layer === startLayer || layer === bossLayer ? Math.abs(rows[0] - middleRow) : 0;
        return offCentreCost * offCentre + random.getFloat(0, arrangementJitter);
    };

    // For each layer, the cheapest total cost of arranging every layer up to it, ending in each of its choices, and which choice of the previous layer that came from.
    const totals = choices.map(layerChoices => layerChoices.map(() => ({ cost: 0, previous: -1 })));
    totals[0].forEach((total, choice) => total.cost = getPlacementCost(0, choices[0][choice]));

    for (let layer = 1; layer < layers.length; layer++) {
        choices[layer].forEach((toRows, choice) => {
            const total = totals[layer][choice];
            total.cost = Infinity;

            choices[layer - 1].forEach((fromRows, previous) => {
                const cost = totals[layer - 1][previous].cost + getLinkCost(layer - 1, fromRows, toRows);
                if (cost < total.cost) {
                    total.cost = cost;
                    total.previous = previous;
                }
            });

            total.cost += getPlacementCost(layer, toRows);
        });
    }

    const rows: number[][] = [];
    let choice = totals[bossLayer].reduce((best, total, index) => (total.cost < totals[bossLayer][best].cost ? index : best), 0);
    for (let layer = bossLayer; layer >= 0; layer--) {
        rows[layer] = choices[layer][choice];
        choice = totals[layer][choice].previous;
    }

    return rows;
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
