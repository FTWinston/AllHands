import type { EnvironmentType } from './EnvironmentType';
import type { ObjectiveInfo } from './ObjectiveInfo';
import type { EncounterId, SectorNodeKind } from './SectorNodeInfo';

export interface DevEncounterInfo {
    id: EncounterId;
    name: string;
    kind: SectorNodeKind;
    environment?: EnvironmentType;
    objective?: ObjectiveInfo;
    /** Whether it has an elite form, which dev tools can launch it in. */
    hasElite: boolean;
}
