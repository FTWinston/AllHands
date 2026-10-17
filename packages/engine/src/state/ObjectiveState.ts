import { Schema, type } from '@colyseus/schema';
import type { ObjectiveInfo, ObjectiveType } from 'common-data/features/sectors/types/ObjectiveInfo';

/** Flat schema form of `ObjectiveInfo`; `durationMs` is 0 unless the objective is `survive`. */
export class ObjectiveState extends Schema {
    constructor(info: ObjectiveInfo) {
        super();
        this.type = info.type;
        this.durationMs = info.type === 'survive' ? info.durationMs : 0;
    }

    @type('string') readonly type: ObjectiveType;
    @type('number') readonly durationMs: number;
}
