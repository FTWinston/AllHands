import { Schema, type } from '@colyseus/schema';
import { WeaponSlotInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CardState } from './CardState';

export class WeaponSlotState extends Schema implements WeaponSlotInfo {
    constructor() {
        super();
    }

    @type(CardState) card: CardState | null = null;
    @type('number') charge = 0;
    @type('string') noFireReason: string | null = null;
    @type('boolean') primed = false;
}
