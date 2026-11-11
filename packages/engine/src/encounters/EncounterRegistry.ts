import { BossAEncounter, BossBEncounter, BossCEncounter } from './bosses';
import { AmbushEncounter, AssaultEncounter, EscortEncounter, SkirmishEncounter } from './CombatEncounter';
import { StationEncounter } from './StationEncounter';
import { defaultSurviveDurationMs, SurviveEncounter } from './SurviveEncounter';
import { TollCollectorsEncounter } from './TollCollectorsEncounter';
import type { Encounter } from './Encounter';
import type { DevEncounterInfo } from 'common-data/features/sectors/types/DevEncounterInfo';
import type { EnvironmentType } from 'common-data/features/sectors/types/EnvironmentType';
import type { ObjectiveInfo } from 'common-data/features/sectors/types/ObjectiveInfo';
import type { EncounterId, SectorNodeInfo, SectorNodeKind, StationKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { GameState } from 'src/state/GameState';

export interface EncounterDefinition {
    id: EncounterId;
    name: string;
    kind: SectorNodeKind;
    /** Absent for encounters without an objective. */
    objective?: ObjectiveInfo;
    /** Environment used when launched standalone from dev tools. */
    defaultEnvironment?: EnvironmentType;
    /** Who is asking for help here, and what they said. Absent for stations, and for encounters that nobody called about. */
    request?: EncounterRequest;
    create(state: GameState, node: SectorNodeInfo): Encounter;
}

/** A call for help, which is what the map shows of the encounter it leads to. */
export interface EncounterRequest {
    /** Who's calling, e.g. "Hauler Local 12". */
    from: string;
    /** What it's about, in a couple of words, e.g. "toll dispute". With who's calling, it names the node. */
    subject: string;
    /** What they said. Science reads this on long range sensors. */
    text: string;
}

/** What a node holding the given encounter is called: who's calling and what about, if anyone is. */
export function getNodeName(definition: EncounterDefinition, fallback: string): string {
    return definition.request ? `${definition.request.from}: ${definition.request.subject}` : fallback;
}

const definitions: readonly EncounterDefinition[] = [
    { id: 'skirmish', name: 'Skirmish', kind: 'combat', objective: { type: 'clear' }, defaultEnvironment: 'deepSpace', create: (state, node) => new SkirmishEncounter(state, node) },
    { id: 'ambush', name: 'Ambush', kind: 'combat', objective: { type: 'clear' }, defaultEnvironment: 'asteroidField', create: (state, node) => new AmbushEncounter(state, node) },
    { id: 'assault', name: 'Assault', kind: 'combat', objective: { type: 'clear' }, defaultEnvironment: 'nebula', create: (state, node) => new AssaultEncounter(state, node) },
    { id: 'escort', name: 'Escorted Cruiser', kind: 'combat', objective: { type: 'clear' }, defaultEnvironment: 'gasGiant', create: (state, node) => new EscortEncounter(state, node) },
    { id: 'survive', name: 'Hold Out', kind: 'combat', objective: { type: 'survive', durationMs: defaultSurviveDurationMs }, defaultEnvironment: 'asteroidField', create: (state, node) => new SurviveEncounter(state, node) },
    {
        id: 'tollCollectors',
        name: 'Toll Collectors',
        kind: 'combat',
        objective: { type: 'clear' },
        defaultEnvironment: 'deepSpace',
        request: { from: 'Hauler Local 12', subject: 'toll dispute', text: 'Wardens on the Kessin jump point, charging forty percent. We can\'t pay it and we can\'t go round.' },
        create: (state, node) => new TollCollectorsEncounter(state, node),
    },
    { id: 'repairStation', name: 'Repair Station', kind: 'repair', create: (state, node) => new StationEncounter(state, node) },
    { id: 'navigationBeacon', name: 'Navigation Beacon', kind: 'navigationBeacon', create: (state, node) => new StationEncounter(state, node) },
    { id: 'armsDealer', name: 'Arms Dealer', kind: 'armsDealer', create: (state, node) => new StationEncounter(state, node) },
    { id: 'salvageYard', name: 'Salvage Yard', kind: 'salvageYard', create: (state, node) => new StationEncounter(state, node) },
    { id: 'researchOutpost', name: 'Research Outpost', kind: 'researchOutpost', create: (state, node) => new StationEncounter(state, node) },
    { id: 'bossA', name: 'Placeholder Boss A', kind: 'boss', objective: { type: 'boss' }, defaultEnvironment: 'asteroidField', create: (state, node) => new BossAEncounter(state, node) },
    { id: 'bossB', name: 'Placeholder Boss B', kind: 'boss', objective: { type: 'boss' }, defaultEnvironment: 'nebula', create: (state, node) => new BossBEncounter(state, node) },
    { id: 'bossC', name: 'Placeholder Boss C', kind: 'boss', objective: { type: 'boss' }, defaultEnvironment: 'deepSpace', create: (state, node) => new BossCEncounter(state, node) },
];

const registry = new Map<EncounterId, EncounterDefinition>(definitions.map(definition => [definition.id, definition]));

export function getEncounterDefinition(id: EncounterId): EncounterDefinition {
    const definition = registry.get(id);
    if (!definition) {
        throw new Error(`Encounter not registered: ${id}`);
    }

    return definition;
}

export function hasEncounter(id: EncounterId): boolean {
    return registry.has(id);
}

export function getEncounterIds(): EncounterId[] {
    return [...registry.keys()];
}

export function createEncounter(state: GameState, node: SectorNodeInfo): Encounter {
    return getEncounterDefinition(node.encounterId).create(state, node);
}

/** The node used when an encounter is launched standalone rather than from a sector map. */
export function getDefaultNode(id: EncounterId): SectorNodeInfo {
    const definition = getEncounterDefinition(id);
    return {
        id: `dev:${id}`,
        kind: definition.kind,
        encounterId: id,
        name: definition.name,
        gridReference: 'A1',
        environment: definition.defaultEnvironment,
        objective: definition.objective,
        request: definition.request?.text,
        x: 0,
        y: 0,
        next: [],
    };
}

export function getDevEncounterList(): DevEncounterInfo[] {
    return definitions.map((definition) => {
        const node = getDefaultNode(definition.id);
        return {
            id: node.encounterId,
            name: node.name,
            kind: node.kind,
            environment: node.environment,
            objective: node.objective,
        };
    });
}

/** The encounter for each kind of station. */
export const stationEncounterIds: Readonly<Record<StationKind, EncounterId>> = {
    repair: 'repairStation',
    navigationBeacon: 'navigationBeacon',
    armsDealer: 'armsDealer',
    salvageYard: 'salvageYard',
    researchOutpost: 'researchOutpost',
};
