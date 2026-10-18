import { Schema, type } from '@colyseus/schema';
import type { RouteCardInfo } from 'common-data/features/cards/types/RouteCardInfo';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';

/** Schema form of `RouteCardInfo`. */
export class RouteCardInfoState extends Schema implements RouteCardInfo {
    constructor(info: RouteCardInfo) {
        super();
        this.nodeId = info.nodeId;
        this.nodeKind = info.nodeKind;
        this.title = info.title;
    }

    @type('string') readonly nodeId: string;
    @type('string') readonly nodeKind: SectorNodeKind;
    @type('string') readonly title: string;
}
