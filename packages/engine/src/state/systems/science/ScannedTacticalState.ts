import { ArraySchema, Schema, type } from '@colyseus/schema';
import { ScannedTacticalInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CardState } from 'src/state/CardState';
import { ScannedWeaponSlotState } from './ScannedWeaponSlotState';

export class ScannedTacticalState extends Schema implements ScannedTacticalInfo {
    @type('string') targetId: string = '';
    @type('uint8') power: number = 0;
    /** Copies of the cards in the system's hand, once science has read it. Null until then. */
    @type([CardState]) hand: ArraySchema<CardState> | null = null;
    @type([ScannedWeaponSlotState]) weaponSlots = new ArraySchema<ScannedWeaponSlotState>();
}
