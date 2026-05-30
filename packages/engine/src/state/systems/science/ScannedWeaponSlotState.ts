import { MapSchema, Schema, type } from '@colyseus/schema';
import { ScannedWeaponSlotInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CardState } from 'src/state/CardState';

export class ScannedWeaponSlotState extends Schema implements ScannedWeaponSlotInfo {
    constructor(id: string) {
        super();
        this.id = id;
    }

    @type('string') readonly id: string;
    @type(CardState) card: CardState | null = null;
    @type({ map: 'number' }) readonly modifiers = new MapSchema<number>();
    @type('number') charge: number = 0;
}
