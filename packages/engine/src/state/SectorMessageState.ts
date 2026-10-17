import { Schema, type } from '@colyseus/schema';
import type { SectorMessageInfo } from 'common-data/features/sectors/types/SectorMapInfo';

export class SectorMessageState extends Schema implements SectorMessageInfo {
    constructor(info: SectorMessageInfo) {
        super();
        this.kind = info.kind;
        this.title = info.title;
        this.text = info.text;
    }

    @type('string') readonly kind: SectorMessageInfo['kind'];
    @type('string') readonly title: string;
    @type('string') readonly text: string;
}
