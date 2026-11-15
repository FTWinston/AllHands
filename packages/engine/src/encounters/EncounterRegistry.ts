import { stationDefinitions } from './StationEncounter';
import type { Encounter } from './Encounter';
import type { EncounterDefinition } from './EncounterDefinition';
import type { DevEncounterInfo } from 'common-data/features/sectors/types/DevEncounterInfo';
import type { EncounterId, SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { GameState } from 'src/state/GameState';

export { getNodeName, type EncounterDefinition, type EncounterRequest } from './EncounterDefinition';
export { stationEncounterIds } from './StationEncounter';

/** Every encounter there is: the stations, which are part of every campaign, and those registered by `registerEngineContent`. */
const definitions: EncounterDefinition[] = [];
const registry = new Map<EncounterId, EncounterDefinition>();

/** Register the given encounters. */
export function registerEncounters(newDefinitions: readonly EncounterDefinition[]) {
    for (const definition of newDefinitions) {
        if (registry.has(definition.id)) {
            throw new Error(`Encounter registered twice: ${definition.id}`);
        }
        registry.set(definition.id, definition);
        definitions.push(definition);
    }
}

registerEncounters(stationDefinitions);

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

/** Whether the encounter has an elite form: every request does, and no station or boss. */
export function hasEliteForm(definition: EncounterDefinition): boolean {
    return definition.kind === 'combat';
}

/** The node used when an encounter is launched standalone rather than from a sector map, in its elite form if asked for and it has one. */
export function getDefaultNode(id: EncounterId, elite = false): SectorNodeInfo {
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
        ...(elite && hasEliteForm(definition) && { elite: true }),
        x: 0,
        y: 0,
        next: [],
    };
}

export function getDevEncounterList(): DevEncounterInfo[] {
    return definitions.map(definition => ({
        id: definition.id,
        name: definition.name,
        kind: definition.kind,
        environment: definition.defaultEnvironment,
        objective: definition.objective,
        hasElite: hasEliteForm(definition),
    }));
}
