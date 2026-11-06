import { ArraySchema, Schema, type } from '@colyseus/schema';
import { ScannedTacticalInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ScannedWeaponSlotState } from './ScannedWeaponSlotState';

export class ScannedTacticalState extends Schema implements ScannedTacticalInfo {
    @type('string') targetId: string = '';
    @type('uint8') power: number = 0;
    @type([ScannedWeaponSlotState]) weaponSlots = new ArraySchema<ScannedWeaponSlotState>();
}
