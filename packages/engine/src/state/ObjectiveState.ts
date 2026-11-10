import { Schema, type } from '@colyseus/schema';
import type { ObjectiveInfo, ObjectiveType } from 'common-data/features/sectors/types/ObjectiveInfo';

/** Flat schema form of `ObjectiveInfo`; `durationMs` is 0 unless the objective is `survive`, and `subject` is empty unless the objective has one. */
export class ObjectiveState extends Schema {
    constructor(info: ObjectiveInfo) {
        super();
        this.type = info.type;
        this.durationMs = info.type === 'survive' ? info.durationMs : 0;
        this.subject = 'subject' in info ? info.subject : '';
    }

    @type('string') readonly type: ObjectiveType;
    @type('number') readonly durationMs: number;
    @type('string') readonly subject: string;
}
