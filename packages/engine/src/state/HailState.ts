import { Schema, type } from '@colyseus/schema';
import type { HailInfo } from 'common-data/features/sectors/types/HailInfo';

export class HailState extends Schema implements HailInfo {
    constructor(info: HailInfo) {
        super();
        this.speaker = info.speaker;
        this.text = info.text;
    }

    @type('string') readonly speaker: string;
    @type('string') readonly text: string;
}
