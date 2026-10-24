import { shopStationKinds, stationKinds } from 'common-data/features/sectors/utils/isStationKind';
import { getEncounterDefinition, stationEncounterIds } from '../encounters/EncounterRegistry';
import type { SectorTheme } from './sectorThemes';
import type { ObjectiveInfo } from 'common-data/features/sectors/types/ObjectiveInfo';
import type { SectorInfo } from 'common-data/features/sectors/types/SectorInfo';
import type { EncounterId, SectorNodeInfo, ShopStationKind, StationKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { IRandom } from 'common-data/types/IRandom';

/** A node's place in the graph, before what it holds is decided. */
interface NodeSlot {
    id: string;
    layer: number;
    next: string[];
}

/** Each kind of station is a role of its own: the map shows which kind it is, so routes past different kinds offer different things. */
type NodeRole = 'start' | 'combat' | 'elite' | 'boss' | StationKind;

/** What a regular encounter can be changed into: an elite, or a mid-sector shop station. */
type OptionalRole = 'elite' | ShopStationKind;

const stationRoles: ReadonlySet<NodeRole | undefined> = new Set(stationKinds);
const shopRoles: ReadonlySet<NodeRole | undefined> = new Set(shopStationKinds);

function isStationRole(role: NodeRole | undefined): role is StationKind {
    return stationRoles.has(role);
}

function isShopRole(role: NodeRole | undefined): role is ShopStationKind {
    return shopRoles.has(role);
}

/** Layers 0..9; every path visits one node per layer, from the start repair station in layer 0 to the boss in layer 9. */
export const sectorLayerCount = 10;
const startLayer = 0;
const preBossRepairLayer = sectorLayerCount - 2;
const bossLayer = sectorLayerCount - 1;

interface Range {
    min: number;
    max: number;
}

/**
 * Mid-sector stations are all shops (every station repairs), in these layers, so none is next to the start or pre-boss repair stations.
 * No two stations are ever back to back, so no route can visit more than three. They're placed on parallel branches until, where possible,
 * every route visits `minShopStationsPerRoute`, so there are many more on the map than on any one route: the choice is which to visit.
 * More may be added to make choices meaningful.
 */
export const midStationLayers = { first: startLayer + 2, last: preBossRepairLayer - 2 } as const;
export const minShopStationsPerRoute = 2;
/** Once every route has its share, this many more are placed, so some routes visit a third. */
const extraShopStationCount: Range = { min: 0, max: 2 };
export const maxMidStationCount = 10;

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
/** How much a graph's score drops if every route has too few shop stations: as much as this many choices of route are worth. */
const fewShopsPenalty = 10;

/** Up to this much random cost is added to each possible arrangement of a layer, to vary between equally good layouts. */
const arrangementJitter = 0.5;

/**
 * Builds a layered, branching DAG with no crossing links: every node leads onward, every node can be reached from the start repair station,
 * and every path ends with a repair station then the single boss node. Shop stations sit on parallel branches in between, so most routes visit two or three
 * but the map offers more to choose from, with elite encounters scattered among them. Every choice of route offers something the others don't.
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

/** Links up layers of nodes, places the stations and elites, then makes sure every choice of route makes a difference. */
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

/**
 * How many nodes offer a choice of route, with a choice right from the start counting for more than any number later,
 * less a penalty for the share of routes that visit fewer than `minShopStationsPerRoute` shop stations.
 */
function scoreChoices({ layers, roles }: SectorGraph): number {
    const choiceCount = layers.flat().filter(slot => slot.next.length > 1).length;
    const startHasChoice = layers[startLayer][0].next.length > 1;
    return choiceCount + (startHasChoice ? sectorLayerCount * maxLayerSize : 0) - fewShopsPenalty * getShareOfRoutesWithFewShops(layers, roles);
}

/** The share of routes from the start to the boss that visit fewer than `minShopStationsPerRoute` shop stations. */
function getShareOfRoutesWithFewShops(layers: NodeSlot[][], roles: Map<string, NodeRole>): number {
    // For each node, how many routes from it to the boss pass each number of shop stations, from none up to the minimum (or more).
    const routeCounts = new Map<string, number[]>();
    for (const slot of layers.flat().reverse()) {
        const counts = new Array<number>(minShopStationsPerRoute + 1).fill(0);
        const shift = isShopRole(roles.get(slot.id)) ? 1 : 0;
        if (slot.next.length === 0) {
            counts[shift] = 1;
        }

        for (const next of slot.next) {
            routeCounts.get(next)!.forEach((count, shops) => counts[Math.min(shops + shift, minShopStationsPerRoute)] += count);
        }

        routeCounts.set(slot.id, counts);
    }

    const counts = routeCounts.get(layers[startLayer][0].id)!;
    const total = counts.reduce((sum, count) => sum + count, 0);
    return (total - counts[minShopStationsPerRoute]) / total;
}

function getLayerSize(random: IRandom, layer: number): number {
    if (layer === startLayer || layer === preBossRepairLayer || layer === bossLayer) {
        return 1;
    }

    // The layer after the single start node can only be as big as its choice of routes.
    const maxSize = layer === startLayer + 1 ? maxRouteChoices : maxLayerSize;
    return 2 + random.getInt(maxSize - 1);
}

/** Fixes the start, pre-boss repair and boss nodes, then places mid-sector shop stations and scatters elite encounters among the rest. */
function assignRoles(random: IRandom, layers: NodeSlot[][], eliteCount: number): Map<string, NodeRole> {
    const roles = new Map<string, NodeRole>(layers.flat().map(slot => [slot.id, 'combat']));
    roles.set(layers[startLayer][0].id, 'start');
    roles.set(layers[preBossRepairLayer][0].id, 'repair');
    roles.set(layers[bossLayer][0].id, 'boss');

    placeShopStations(random, layers, roles);

    const pool = layers.flat();
    for (let placed = 0; placed < eliteCount && pool.length > 0;) {
        const slot = random.delete(pool);
        if (canTakeRole(layers, roles, slot, 'elite', eliteCount)) {
            roles.set(slot.id, 'elite');
            placed++;
        }
    }

    return roles;
}

/**
 * Puts shop stations on whichever routes visit fewest, until every route visits `minShopStationsPerRoute` or no more can be placed on those
 * that don't, then adds a few more anywhere they fit. Filling in the routes that have fewest spreads stations across parallel branches,
 * rather than piling them onto routes that already have some.
 */
function placeShopStations(random: IRandom, layers: NodeSlot[][], roles: Map<string, NodeRole>) {
    const placeOne = (canPlace: (fewest: number) => boolean) => {
        const fewestByNode = getFewestShopStations(layers, roles);
        const candidates = layers.flat()
            .filter(slot => canPlace(fewestByNode.get(slot.id)!) && canTakeRole(layers, roles, slot, 'station', 0));
        if (candidates.length === 0) {
            return false;
        }

        const fewest = Math.min(...candidates.map(slot => fewestByNode.get(slot.id)!));
        const slot = random.pick(candidates.filter(candidate => fewestByNode.get(candidate.id) === fewest));
        roles.set(slot.id, pickShopStationKind(random, layers, roles, slot));
        return true;
    };

    while (placeOne(fewest => fewest < minShopStationsPerRoute)) {
        // Keep going until every route has enough, or no more fit.
    }

    for (let extra = pickInRange(random, extraShopStationCount); extra > 0; extra--) {
        if (!placeOne(() => true)) {
            break;
        }
    }
}

/** For each node, the fewest shop stations visited by any route through it. */
function getFewestShopStations(layers: NodeSlot[][], roles: Map<string, NodeRole>): Map<string, number> {
    const shopCount = (slot: NodeSlot) => (isShopRole(roles.get(slot.id)) ? 1 : 0);

    // The fewest on the way to each node, including it.
    const before = new Map<string, number>([[layers[startLayer][0].id, 0]]);
    for (const slot of layers.flat()) {
        const count = before.get(slot.id)! + shopCount(slot);
        before.set(slot.id, count);
        for (const id of slot.next) {
            before.set(id, Math.min(before.get(id) ?? Infinity, count));
        }
    }

    // The fewest from each node on to the boss, including it.
    const after = new Map<string, number>();
    for (const slot of layers.flat().reverse()) {
        const onward = slot.next.length === 0 ? 0 : Math.min(...slot.next.map(id => after.get(id)!));
        after.set(slot.id, onward + shopCount(slot));
    }

    return new Map(layers.flat().map(slot => [slot.id, before.get(slot.id)! + after.get(slot.id)! - shopCount(slot)]));
}

/**
 * Picks which kind of shop a node should be, preferring one that no station on the same route already is,
 * then one that no other station in its layer that shares a link with it is, so the choice between them is between different shops,
 * then whichever the sector has fewest of.
 */
function pickShopStationKind(random: IRandom, layers: NodeSlot[][], roles: Map<string, NodeRole>, slot: NodeSlot): ShopStationKind {
    const slots = layers.flat();

    // Every node a route through this one also passes: those it leads to, and those that lead to it.
    const onSameRoute = new Set(getReachable(new Map(slots.map(other => [other.id, other])), slot.id));
    for (const other of [...slots].reverse().filter(other => other.layer < slot.layer)) {
        if (other.next.some(id => onSameRoute.has(id))) {
            onSameRoute.add(other.id);
        }
    }
    onSameRoute.delete(slot.id);

    const previous = layers[slot.layer - 1].filter(other => other.next.includes(slot.id));
    const sharesLink = (other: NodeSlot) => other !== slot && other.layer === slot.layer
        && (previous.some(from => from.next.includes(other.id)) || other.next.some(id => slot.next.includes(id)));
    const alongside = slots.filter(sharesLink);

    const sameRoute = slots.filter(other => onSameRoute.has(other.id));

    const getCost = (kind: ShopStationKind) => {
        const count = (among: NodeSlot[]) => among.filter(other => roles.get(other.id) === kind).length;
        return 100 * count(sameRoute) + 10 * count(alongside) + count(slots);
    };

    const costs = shopStationKinds.map(getCost);
    const cheapest = Math.min(...costs);
    return random.pick(shopStationKinds.filter((_, index) => costs[index] === cheapest));
}

/**
 * Whether a regular encounter could become a mid-sector station or an elite. Each must be in the layers allowed for it, within its limit,
 * and not linked to another of its kind, so no two stations (of any kind) or elites can be visited back to back.
 */
function canTakeRole(layers: NodeSlot[][], roles: Map<string, NodeRole>, slot: NodeSlot, role: 'station' | 'elite', maxElites: number): boolean {
    if (roles.get(slot.id) !== 'combat') {
        return false;
    }

    const isStation = role === 'station';
    const [firstLayer, lastLayer] = isStation ? [midStationLayers.first, midStationLayers.last] : [startLayer + 2, preBossRepairLayer - 1];
    if (slot.layer < firstLayer || slot.layer > lastLayer) {
        return false;
    }

    const hasRole = (id: string) => (isStation ? isShopRole(roles.get(id)) : roles.get(id) === 'elite');
    if (slot.next.some(hasRole) || layers[slot.layer - 1].some(other => other.next.includes(slot.id) && hasRole(other.id))) {
        return false;
    }

    let count = 0;
    for (const slots of layers) {
        for (const other of slots) {
            if (hasRole(other.id)) {
                count++;
            }
        }
    }

    return count < (isStation ? maxMidStationCount : maxElites);
}

/**
 * How the map shows each role, as one letter each. Only what the map shows can make one route different from another,
 * and it shows which kind each station is, so passing a different kind of shop is a different route.
 */
const roleSymbols: Record<NodeRole, string> = {
    start: 'r',
    repair: 'r',
    navigationBeacon: 'n',
    armsDealer: 'w',
    salvageYard: 'g',
    researchOutpost: 's',
    combat: 'c',
    elite: 'e',
    boss: 'b',
};

/**
 * Each node's possible futures: the sequences of regular encounters, elites and each kind of station the map shows on the way from it to the boss.
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
            .flatMap(id => (['elite', 'station'] as const).map(role => ({ slot: slots.get(id)!, role })));
        random.shuffle(retypes);

        const improved = retypes.some(({ slot, role: retype }) => {
            if (!canTakeRole(layers, roles, slot, retype, maxElites)) {
                return false;
            }

            const role: OptionalRole = retype === 'station' ? pickShopStationKind(random, layers, roles, slot) : 'elite';

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

    if (role === 'start' || isStationRole(role)) {
        const kind: StationKind = role === 'start' ? 'repair' : role;
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
