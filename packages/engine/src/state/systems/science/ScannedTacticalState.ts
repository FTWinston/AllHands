import { ArraySchema, type } from '@colyseus/schema';
import { ScannedTacticalInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ScannedSystemState } from './ScannedSystemState';
import { ScannedWeaponSlotState } from './ScannedWeaponSlotState';
import type { TacticalState } from '../tactical/TacticalState';

export class ScannedTacticalState extends ScannedSystemState<TacticalState> implements ScannedTacticalInfo {
    @type([ScannedWeaponSlotState]) weaponSlots = new ArraySchema<ScannedWeaponSlotState>();

    protected override copySystemData(source: TacticalState) {
        // Make the slots be the same length.
        while (this.weaponSlots.length < source.slots.length) {
            const src = source.slots[this.weaponSlots.length];
            this.weaponSlots.push(new ScannedWeaponSlotState(src.id));
        }
        while (this.weaponSlots.length > source.slots.length) {
            this.weaponSlots.pop();
        }

        for (let i = 0; i < source.slots.length; i++) {
            const src = source.slots[i];
            const dest = this.weaponSlots[i];
            dest.charge = src.charge;
            dest.card = src.card?.cloneCard() ?? null;
            dest.modifierCard = src.modifierCard;
            dest.modifiers.clear();
            for (const [key, value] of src.modifiers) {
                dest.modifiers.set(key, value);
            }
        }
    }
}
