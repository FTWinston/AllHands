import { stationKinds } from 'common-data/features/sectors/utils/isStationKind';
import { getEncounterDefinition, stationEncounterIds } from '../encounters/EncounterRegistry';
import type { SectorTheme } from './sectorThemes';
import type { ObjectiveInfo } from 'common-data/features/sectors/types/ObjectiveInfo';
import type { SectorInfo } from 'common-data/features/sectors/types/SectorInfo';
import type { EncounterId, SectorNodeInfo, StationKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { IRandom } from 'common-data/types/IRandom';

/** A node's place in the graph, before what it holds is decided. */
interface NodeSlot {
    id: string;
    layer: number;
    next: string[];
}

type NodeRole = 'start' | 'combat' | 'elite' | 'repair' | 'boss';

/** Layers 0..9; every path visits one node per layer, from the start repair station in layer 0 to the boss in layer 9. */
export const sectorLayerCount = 10;
const startLayer = 0;
const preBossRepairLayer = sectorLayerCount - 2;
const bossLayer = sectorLayerCount - 1;

/** Mid-sector repair stations go somewhere in these layers, and routes can bypass them. More may be added to make choices meaningful. */
export const midRepairLayers = { first: 3, last: 5 } as const;
const initialMidRepairCount = 2;
export const maxMidRepairCount = 3;

interface Range {
    min: number;
    max: number;
}

interface EliteLimits {
    /** How many elites are placed at first. */
    initial: Range;
    /** The most there can be once more are added to make choices meaningful, which usually happens, so this mostly decides how many there are. */
    max: Range;
}

/** Elite encounters go in any encounter layer but the first. Each sector has more than the last; any beyond these use the last limits. */
const eliteLimitsBySector: readonly EliteLimits[] = [
    { initial: { min: 1, max: 2 }, max: { min: 2, max: 4 } },
    { initial: { min: 2, max: 3 }, max: { min: 3, max: 5 } },
    { initial: { min: 2, max: 3 }, max: { min: 4, max: 6 } },
];

/** The most elites a sector can have. */
export function getMaxEliteCount(sectorIndex: number): number {
    return getEliteLimits(sectorIndex).max.max;
}

function getEliteLimits(sectorIndex: number): EliteLimits {
    return eliteLimitsBySector[Math.min(sectorIndex, eliteLimitsBySector.length - 1)];
}

function pickInRange(random: IRandom, { min, max }: Range): number {
    return min + random.getInt(max - min + 1);
}

const easyEncounters: readonly EncounterId[] = ['skirmish', 'ambush', 'survive'];
const hardEncounters: readonly EncounterId[] = ['assault', 'escort', 'survive', 'ambush'];
/** Encounter layers 1..easyLayerCount use the easier encounters. */
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
/** How many graphs `generateSector` makes, keeping the one that offers the most real choices. */
const graphAttempts = 10;

/** Up to this much random cost is added to each possible arrangement of a layer, to vary between equally good layouts. */
const arrangementJitter = 0.5;

/**
 * Builds a layered, branching DAG with no crossing links: every node leads onward, every node can be reached from the start repair station,
 * and every path ends with a repair station then the single boss node. Optional repair stations and elite encounters are scattered in between,
 * and every choice of route offers something the others don't.
 */
export function generateSector(random: IRandom, theme: SectorTheme, sectorIndex: number): SectorInfo {
    // Removing meaningless choices can leave few real ones, so make several graphs and keep the one with the most.
    let best: SectorGraph | undefined;
    for (let attempt = 0; attempt < graphAttempts; attempt++) {
        const graph = generateGraph(random, theme, getEliteLimits(sectorIndex));
        if (!best || scoreChoices(graph) > scoreChoices(best)) {
            best = graph;
        }
    }

    const { layers, roles } = best!;
    const rows = arrangeRows(random, layers);
    const names = createNamePicker(random, theme);

    const nodes = layers.flatMap((slots, layer) =>
        slots.map((slot, index) => createNode(random, theme, names, slot, roles.get(slot.id)!, rows[layer][index]))
    );

    return {
        id: theme.id,
        name: theme.name,
        introMessage: theme.introMessage,
        outroMessage: theme.outroMessage,
        defeatMessage: theme.defeatMessage,
        nodes,
        startNodeId: layers[startLayer][0].id,
        bossNodeId: layers[bossLayer][0].id,
    };
}

interface SectorGraph {
    layers: NodeSlot[][];
    roles: Map<string, NodeRole>;
}

/** Links up layers of nodes, places the repair stations and elites, then makes sure every choice of route makes a difference. */
function generateGraph(random: IRandom, theme: SectorTheme, eliteLimits: EliteLimits): SectorGraph {
    const maxElites = pickInRange(random, eliteLimits.max);

    const layers = Array.from({ length: sectorLayerCount }, (_, layer) =>
        Array.from({ length: getLayerSize(random, layer) }, (_, index): NodeSlot => ({ id: `${theme.id}-${layer}-${index}`, layer, next: [] }))
    );

    for (let layer = 0; layer < bossLayer; layer++) {
        linkLayers(random, layers[layer], layers[layer + 1]);
    }

    const roles = assignRoles(random, layers, Math.min(pickInRange(random, eliteLimits.initial), maxElites));
    return { layers: resolveMeaninglessChoices(random, layers, roles, maxElites), roles };
}

/** How many nodes offer a choice of route, with a choice right from the start counting for more than any number later. */
function scoreChoices({ layers }: SectorGraph): number {
    const choiceCount = layers.flat().filter(slot => slot.next.length > 1).length;
    const startHasChoice = layers[startLayer][0].next.length > 1;
    return choiceCount + (startHasChoice ? sectorLayerCount * maxLayerSize : 0);
}

function getLayerSize(random: IRandom, layer: number): number {
    if (layer === startLayer || layer === preBossRepairLayer || layer === bossLayer) {
        return 1;
    }

    // The layer after the single start node can only be as big as its choice of routes.
    const maxSize = layer === startLayer + 1 ? maxRouteChoices : maxLayerSize;
    return 2 + random.getInt(maxSize - 1);
}

/** Fixes the start, pre-boss repair and boss nodes, then scatters mid-sector repair stations and elite encounters among the rest. */
function assignRoles(random: IRandom, layers: NodeSlot[][], eliteCount: number): Map<string, NodeRole> {
    const roles = new Map<string, NodeRole>(layers.flat().map(slot => [slot.id, 'combat']));
    roles.set(layers[startLayer][0].id, 'start');
    roles.set(layers[preBossRepairLayer][0].id, 'repair');
    roles.set(layers[bossLayer][0].id, 'boss');

    const place = (role: 'repair' | 'elite', count: number) => {
        const pool = layers.flat();
        for (let placed = 0; placed < count && pool.length > 0;) {
            const slot = random.delete(pool);
            if (canTakeRole(layers, roles, slot, role, eliteCount)) {
                roles.set(slot.id, role);
                placed++;
            }
        }
    };

    place('repair', initialMidRepairCount);
    place('elite', eliteCount);

    return roles;
}

/**
 * Whether a regular encounter could become a repair station or elite. Each must be in the layers allowed for it, within its limit,
 * and not linked to another of its kind, so no two can be visited back to back. Repair stations must also leave some route that avoids them all.
 */
function canTakeRole(layers: NodeSlot[][], roles: Map<string, NodeRole>, slot: NodeSlot, role: 'repair' | 'elite', maxElites: number): boolean {
    if (roles.get(slot.id) !== 'combat') {
        return false;
    }

    const isRepair = role === 'repair';
    const [firstLayer, lastLayer] = isRepair ? [midRepairLayers.first, midRepairLayers.last] : [startLayer + 2, preBossRepairLayer - 1];
    if (slot.layer < firstLayer || slot.layer > lastLayer) {
        return false;
    }

    const nodes = layers.flat();
    const sameRole = nodes.filter(other => roles.get(other.id) === role && other.layer > startLayer && other.layer < preBossRepairLayer);
    if (sameRole.length >= (isRepair ? maxMidRepairCount : maxElites)) {
        return false;
    }

    if (sameRole.some(other => other.next.includes(slot.id) || slot.next.includes(other.id))) {
        return false;
    }

    return !isRepair || reachesBossAvoiding(layers, new Set([...sameRole, slot].map(other => other.id)));
}

/** Whether some route from the start to the boss avoids every one of the given nodes. */
function reachesBossAvoiding(layers: NodeSlot[][], avoidIds: Set<string>): boolean {
    const slots = new Map(layers.flat().map(slot => [slot.id, slot]));
    const reached = new Map<string, boolean>();
    const reachesBoss = (slot: NodeSlot): boolean => {
        if (!reached.has(slot.id)) {
            reached.set(slot.id, slot.layer === bossLayer || slot.next.some(id => !avoidIds.has(id) && reachesBoss(slots.get(id)!)));
        }

        return reached.get(slot.id)!;
    };

    return reachesBoss(layers[startLayer][0]);
}

/** How the map shows each role, as one letter each. Only what the map shows can make one route different from another. */
const roleSymbols: Record<NodeRole, string> = {
    start: 'r',
    repair: 'r',
    combat: 'c',
    elite: 'e',
    boss: 'b',
};

/**
 * Each node's possible futures: the sequences of regular encounters, elites and repair stations the map shows on the way from it to the boss.
 */
function getFutures(layers: NodeSlot[][], roles: Map<string, NodeRole>): Map<string, Set<string>> {
    const futures = new Map<string, Set<string>>();

    for (const slots of [...layers].reverse()) {
        for (const slot of slots) {
            const symbol = roleSymbols[roles.get(slot.id)!];
            const onward = slot.next.flatMap(id => [...futures.get(id)!]);
            futures.set(slot.id, new Set(onward.length === 0 ? [symbol] : onward.map(future => symbol + future)));
        }
    }

    return futures;
}

interface DominatedChoice {
    from: NodeSlot;
    /** The link that offers nothing more than `byId` does. */
    dominatedId: string;
    byId: string;
}

/** Every link that offers no real choice, because everything it leads to is also on offer down another link from the same node. */
function findDominatedChoices(layers: NodeSlot[][], roles: Map<string, NodeRole>): DominatedChoice[] {
    const futures = getFutures(layers, roles);

    return layers.flat().flatMap(from => from.next.flatMap(dominatedId => from.next
        .filter(byId => byId !== dominatedId && isSubset(futures.get(dominatedId)!, futures.get(byId)!))
        .map(byId => ({ from, dominatedId, byId }))
    ));
}

function isSubset<T>(subset: Set<T>, superset: Set<T>): boolean {
    return subset.size <= superset.size && [...subset].every(item => superset.has(item));
}

/** The ids of every node reachable from (and including) the given one. */
function getReachable(slots: Map<string, NodeSlot>, fromId: string): Set<string> {
    const reachable = new Set([fromId]);
    for (const id of reachable) {
        for (const next of slots.get(id)!.next) {
            reachable.add(next);
        }
    }

    return reachable;
}

/**
 * Makes every choice of route count. Wherever everything one link leads to is also on offer down another from the same node, there's no reason to take it.
 * Where possible, a regular encounter only reachable down that link becomes an elite or repair station, so it offers something the other doesn't.
 * That's kept only if it leaves fewer meaningless choices overall. Otherwise the link is removed, along with any nodes left unreachable.
 * Removing it loses nothing, since the other link still offers everything it did. Each step leaves fewer meaningless choices, so this always finishes.
 */
function resolveMeaninglessChoices(random: IRandom, layers: NodeSlot[][], roles: Map<string, NodeRole>, maxElites: number): NodeSlot[][] {
    let dominated = findDominatedChoices(layers, roles);

    while (dominated.length > 0) {
        const { from, dominatedId, byId } = dominated[0];
        const slots = new Map(layers.flat().map(slot => [slot.id, slot]));
        const alsoReachedByOther = getReachable(slots, byId);

        const retypes = [...getReachable(slots, dominatedId)]
            .filter(id => !alsoReachedByOther.has(id))
            .flatMap(id => (['elite', 'repair'] as const).map(role => ({ slot: slots.get(id)!, role })));
        random.shuffle(retypes);

        const improved = retypes.some(({ slot, role }) => {
            if (!canTakeRole(layers, roles, slot, role, maxElites)) {
                return false;
            }

            roles.set(slot.id, role);
            const remaining = findDominatedChoices(layers, roles);
            if (remaining.length < dominated.length) {
                dominated = remaining;
                return true;
            }

            roles.set(slot.id, 'combat');
            return false;
        });

        if (!improved) {
            from.next = from.next.filter(id => id !== dominatedId);
            const reachable = getReachable(slots, layers[startLayer][0].id);
            layers = layers.map(layerSlots => layerSlots.filter(slot => reachable.has(slot.id)));
            dominated = findDominatedChoices(layers, roles);
        }
    }

    return layers;
}

function createNode(random: IRandom, theme: SectorTheme, names: NamePicker, slot: NodeSlot, role: NodeRole, row: number): SectorNodeInfo {
    const base = {
        id: slot.id,
        x: slot.layer / (sectorLayerCount - 1),
        y: row / (sectorRowCount - 1),
        next: slot.next,
    };

    if (role === 'boss') {
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

    if (role === 'start' || role === 'repair') {
        // The start and pre-boss stations just repair. Others may be any kind of station, shops included.
        const kind: StationKind = role === 'repair' && slot.layer !== preBossRepairLayer ? random.pick(stationKinds) : 'repair';
        const definition = getEncounterDefinition(stationEncounterIds[kind]);
        return {
            ...base,
            kind,
            encounterId: definition.id,
            name: names.pickStation(kind),
        };
    }

    const encounterId = random.pick(slot.layer <= easyLayerCount ? easyEncounters : hardEncounters);
    const definition = getEncounterDefinition(encounterId);

    return {
        ...base,
        kind: 'combat',
        encounterId,
        name: names.pickLocation(),
        environment: random.pick(theme.environments),
        factionId: theme.factionId,
        objective: createObjective(random, definition.objective),
        ...(role === 'elite' && { elite: true }),
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
 * Only a single node can be left with more than `maxRouteChoices` links, so `getLayerSize` keeps the layer after the start node small enough.
 */
function linkLayers(random: IRandom, from: NodeSlot[], to: NodeSlot[]) {
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
function arrangeRows(random: IRandom, layers: NodeSlot[][]): number[][] {
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
    pickStation(kind: StationKind): string;
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

    const stationPickers = Object.fromEntries(stationKinds.map(kind => [kind, pickFrom(theme.stationNames[kind])])) as Record<StationKind, () => string>;

    return {
        pickLocation: pickFrom(theme.locationNames),
        pickStation: (kind: StationKind) => stationPickers[kind](),
    };
}
