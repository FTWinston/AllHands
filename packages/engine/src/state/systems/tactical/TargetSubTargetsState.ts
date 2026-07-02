import { ArraySchema, Schema, type } from '@colyseus/schema';
import { TargetSubTargets } from 'common-data/features/space/types/GameObjectInfo';
import { SubTargetState } from './SubTargetState';

export class TargetSubTargetsState extends Schema implements TargetSubTargets {
    @type([SubTargetState]) subTargets = new ArraySchema<SubTargetState>();
}
