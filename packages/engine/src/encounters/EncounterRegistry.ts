import { BossAEncounter, BossBEncounter, BossCEncounter } from './bosses';
import { AmbushEncounter, AssaultEncounter, EscortEncounter, SkirmishEncounter } from './CombatEncounter';
import { StationEncounter } from './StationEncounter';
import { defaultSurviveDurationMs, SurviveEncounter } from './SurviveEncounter';
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
    /** Environment and faction used when launched standalone from dev tools. */
    defaultEnvironment?: EnvironmentType;
    defaultFactionId?: string;
    create(state: GameState, node: SectorNodeInfo): Encounter;
}

const definitions: readonly EncounterDefinition[] = [
    { id: 'skirmish', name: 'Skirmish', kind: 'combat', objective: { type: 'destroyAll' }, defaultEnvironment: 'deepSpace', defaultFactionId: 'factionA', create: (state, node) => new SkirmishEncounter(state, node) },
    { id: 'ambush', name: 'Ambush', kind: 'combat', objective: { type: 'destroyAll' }, defaultEnvironment: 'asteroidField', defaultFactionId: 'factionA', create: (state, node) => new AmbushEncounter(state, node) },
    { id: 'assault', name: 'Assault', kind: 'combat', objective: { type: 'destroyAll' }, defaultEnvironment: 'nebula', defaultFactionId: 'factionB', create: (state, node) => new AssaultEncounter(state, node) },
    { id: 'escort', name: 'Escorted Cruiser', kind: 'combat', objective: { type: 'destroyAll' }, defaultEnvironment: 'gasGiant', defaultFactionId: 'factionC', create: (state, node) => new EscortEncounter(state, node) },
    { id: 'survive', name: 'Hold Out', kind: 'combat', objective: { type: 'survive', durationMs: defaultSurviveDurationMs }, defaultEnvironment: 'asteroidField', defaultFactionId: 'factionA', create: (state, node) => new SurviveEncounter(state, node) },
    { id: 'repairStation', name: 'Repair Station', kind: 'repair', create: (state, node) => new StationEncounter(state, node) },
    { id: 'navigationBeacon', name: 'Navigation Beacon', kind: 'navigationBeacon', create: (state, node) => new StationEncounter(state, node) },
    { id: 'armsDealer', name: 'Arms Dealer', kind: 'armsDealer', create: (state, node) => new StationEncounter(state, node) },
    { id: 'salvageYard', name: 'Salvage Yard', kind: 'salvageYard', create: (state, node) => new StationEncounter(state, node) },
    { id: 'researchOutpost', name: 'Research Outpost', kind: 'researchOutpost', create: (state, node) => new StationEncounter(state, node) },
    { id: 'bossA', name: 'Placeholder Boss A', kind: 'boss', objective: { type: 'boss' }, defaultEnvironment: 'asteroidField', defaultFactionId: 'factionA', create: (state, node) => new BossAEncounter(state, node) },
    { id: 'bossB', name: 'Placeholder Boss B', kind: 'boss', objective: { type: 'boss' }, defaultEnvironment: 'nebula', defaultFactionId: 'factionB', create: (state, node) => new BossBEncounter(state, node) },
    { id: 'bossC', name: 'Placeholder Boss C', kind: 'boss', objective: { type: 'boss' }, defaultEnvironment: 'deepSpace', defaultFactionId: 'factionC', create: (state, node) => new BossCEncounter(state, node) },
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
        environment: definition.defaultEnvironment,
        factionId: definition.defaultFactionId,
        objective: definition.objective,
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
            factionId: node.factionId,
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
