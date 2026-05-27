import { ArraySchema, Schema, type } from '@colyseus/schema';
import { ScannedTacticalInfo } from 'common-data/features/space/types/GameObjectInfo';
import { WeaponSlotState } from '../tactical/WeaponSlotState';

export class ScannedTacticalState extends Schema implements ScannedTacticalInfo {
    @type('string') targetId: string = '';
    @type([WeaponSlotState]) weaponSlots = new ArraySchema<WeaponSlotState>();
}
