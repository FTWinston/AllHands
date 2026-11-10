import type { EnvironmentType } from 'common-data/features/sectors/types/EnvironmentType';
import type { EncounterOutcome, ObjectiveInfo } from 'common-data/features/sectors/types/ObjectiveInfo';
import type { EncounterId } from 'common-data/features/sectors/types/SectorNodeInfo';

/** Server-only summary of the running encounter; clients learn nothing about it beyond what their cards and displays show. */
export class EncounterSummaryState {
    constructor(readonly encounterId: EncounterId, readonly name: string) {}

    environment?: EnvironmentType;
    /** Absent for encounters without an objective, such as repair stations. */
    objective?: ObjectiveInfo;
    /** How the encounter ended, or null while it's still undecided. Either way, it's then over, and the crew can leave. */
    outcome: EncounterOutcome | null = null;
    /** Game time (ms) at which a `survive` objective completes; 0 otherwise. */
    objectiveEndTime = 0;
}
