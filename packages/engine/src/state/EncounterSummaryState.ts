import { Schema, type } from '@colyseus/schema';
import { ObjectiveState } from './ObjectiveState';
import type { EnvironmentType } from 'common-data/features/sectors/types/EnvironmentType';
import type { EncounterId } from 'common-data/features/sectors/types/SectorNodeInfo';

/** What clients may show about the running encounter; the encounter itself is server-only. */
export class EncounterSummaryState extends Schema {
    constructor(encounterId: EncounterId, name: string) {
        super();
        this.encounterId = encounterId;
        this.name = name;
    }

    @type('string') readonly encounterId: EncounterId;
    @type('string') readonly name: string;
    @type('string') environment?: EnvironmentType;
    @type('string') factionId?: string;
    /** Absent for encounters without an objective, such as repair stations. */
    @type(ObjectiveState) objective?: ObjectiveState;
    @type('boolean') objectiveMet = false;
    /** Game time (ms) at which a `survive` objective completes; 0 otherwise. */
    @type('number') objectiveEndTime = 0;
}
