import { Schema, type } from '@colyseus/schema';
import { ObjectiveState } from './ObjectiveState';
import type { RouteCardDetail, RouteCardInfo } from 'common-data/features/cards/types/RouteCardInfo';
import type { EnvironmentType } from 'common-data/features/sectors/types/EnvironmentType';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';

/** Schema form of `RouteCardInfo`. */
export class RouteCardInfoState extends Schema implements RouteCardInfo {
    constructor(info: RouteCardInfo) {
        super();
        this.nodeId = info.nodeId;
        this.nodeKind = info.nodeKind;
        this.title = info.title;
        this.detail = info.detail;
        this.environment = info.environment;
        this.factionId = info.factionId;
        this.objective = info.objective ? new ObjectiveState(info.objective) : undefined;
    }

    @type('string') readonly nodeId: string;
    @type('string') readonly nodeKind: SectorNodeKind;
    @type('string') readonly title: string;
    @type('string') readonly detail: RouteCardDetail;
    @type('string') readonly environment?: EnvironmentType;
    @type('string') readonly factionId?: string;
    @type(ObjectiveState) readonly objective?: ObjectiveState;
}
