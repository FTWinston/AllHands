import { ArraySchema, Schema, type } from '@colyseus/schema';
import type { SectorMapNodeInfo } from 'common-data/features/sectors/types/SectorMapInfo';
import type { SectorNodeInfo, SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';

/** The synced, detail-free part of a sector node. */
export class SectorMapNodeState extends Schema implements SectorMapNodeInfo {
    constructor(info: SectorNodeInfo) {
        super();
        this.id = info.id;
        this.kind = info.kind;
        this.name = info.name;
        this.x = info.x;
        this.y = info.y;
        this.next.push(...info.next);
    }

    @type('string') readonly id: string;
    @type('string') readonly kind: SectorNodeKind;
    @type('string') readonly name: string;
    @type('number') readonly x: number;
    @type('number') readonly y: number;
    @type(['string']) readonly next = new ArraySchema<string>();
}
