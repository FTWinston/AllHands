import { getEnvironmentLabel, getFactionLabel, getNodeKindLabel, getObjectiveLabel } from 'common-data/features/sectors/utils/sectorLabels';
import type { EnvironmentType } from 'common-data/features/sectors/types/EnvironmentType';
import type { ObjectiveInfo } from 'common-data/features/sectors/types/ObjectiveInfo';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';

export interface EncounterDescriptionSource {
    kind: SectorNodeKind;
    environment?: EnvironmentType;
    factionId?: string;
    objective?: ObjectiveInfo;
}

export interface EncounterDescription {
    kind: string;
    environment: string | null;
    faction: string | null;
    objective: string | null;
}

export function describeEncounter(source: EncounterDescriptionSource): EncounterDescription {
    return {
        kind: getNodeKindLabel(source.kind),
        environment: source.environment ? getEnvironmentLabel(source.environment) : null,
        faction: source.factionId ? getFactionLabel(source.factionId) : null,
        objective: source.objective ? getObjectiveLabel(source.objective) : null,
    };
}
