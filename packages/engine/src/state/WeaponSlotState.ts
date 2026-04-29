import { MapSchema, Schema, type } from '@colyseus/schema';
import { WeaponSlotInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CardState } from './CardState';

export class WeaponSlotState extends Schema implements WeaponSlotInfo {
    constructor() {
        super();
    }

    @type(CardState) card: CardState | null = null;
    @type({ map: 'number' }) modifiers = new MapSchema<number>();
    @type('number') charge = 0;
    @type('string') noFireReason: string | null = null;
    @type('boolean') primed = false;

    getCombinedModifier(modifier: string): number {
        if (!this.card) {
            return 0;
        }

        return (this.card.modifiers.get(modifier) || 0) + (this.modifiers.get(modifier) || 0);
    }

    isCharged(): boolean {
        if (!this.card) {
            return false;
        }

        const chargeRequired = this.getCombinedModifier('chargeRequired');

        return this.charge >= chargeRequired;
    }
}
