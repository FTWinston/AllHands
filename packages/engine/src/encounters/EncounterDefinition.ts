import type { Encounter } from './Encounter';
import type { EnvironmentType } from 'common-data/features/sectors/types/EnvironmentType';
import type { ObjectiveInfo } from 'common-data/features/sectors/types/ObjectiveInfo';
import type { EncounterId, SectorNodeInfo, SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { GameState } from 'src/state/GameState';

/**
 * Everything about an encounter that's known before it starts: what the map shows of it, and how to create it.
 * Each encounter's file exports its own, beside the class, and `EncounterRegistry` lists them all.
 */
export interface EncounterDefinition {
    id: EncounterId;
    name: string;
    kind: SectorNodeKind;
    /** Absent for encounters without an objective. A node holding the encounter is given this, and the encounter reads it from the node. */
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
