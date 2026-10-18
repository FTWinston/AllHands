import { Schema, type } from '@colyseus/schema';
import { ObjectiveState } from './ObjectiveState';
import type { EnvironmentType } from 'common-data/features/sectors/types/EnvironmentType';
import type { SectorDestinationInfo } from 'common-data/features/sectors/types/SectorDestinationInfo';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';

/** Schema form of `SectorDestinationInfo`, as shown on science's long range sensors. */
export class SectorDestinationState extends Schema implements SectorDestinationInfo {
    constructor(info: SectorDestinationInfo) {
        super();
        this.id = info.id;
        this.kind = info.kind;
        this.name = info.name;
        this.environment = info.environment;
        this.factionId = info.factionId;
        this.objective = info.objective ? new ObjectiveState(info.objective) : undefined;
    }

    @type('string') readonly id: string;
    @type('string') readonly kind: SectorNodeKind;
    @type('string') readonly name: string;
    @type('string') readonly environment?: EnvironmentType;
    @type('string') readonly factionId?: string;
    @type(ObjectiveState) readonly objective?: ObjectiveState;
}
