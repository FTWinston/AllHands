import { ArraySchema, Schema, type } from '@colyseus/schema';
import { ObjectiveState } from './ObjectiveState';
import type { EnvironmentType } from 'common-data/features/sectors/types/EnvironmentType';
import type { EncounterId, SectorNodeInfo, SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';

export class SectorNodeState extends Schema {
    constructor(info: SectorNodeInfo) {
        super();
        this.id = info.id;
        this.kind = info.kind;
        this.encounterId = info.encounterId;
        this.name = info.name;
        this.environment = info.environment;
        this.factionId = info.factionId;
        this.objective = info.objective ? new ObjectiveState(info.objective) : undefined;
        this.x = info.x;
        this.y = info.y;
        this.next.push(...info.next);
    }

    @type('string') readonly id: string;
    @type('string') readonly kind: SectorNodeKind;
    @type('string') readonly encounterId: EncounterId;
    @type('string') readonly name: string;
    @type('string') readonly environment?: EnvironmentType;
    @type('string') readonly factionId?: string;
    @type(ObjectiveState) readonly objective?: ObjectiveState;
    @type('number') readonly x: number;
    @type('number') readonly y: number;
    @type(['string']) readonly next = new ArraySchema<string>();

    toInfo(): SectorNodeInfo {
        return {
            id: this.id,
            kind: this.kind,
            encounterId: this.encounterId,
            name: this.name,
            environment: this.environment,
            factionId: this.factionId,
            objective: this.objective,
            x: this.x,
            y: this.y,
            next: [...this.next],
        };
    }
}
