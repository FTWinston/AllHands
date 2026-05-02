import { MapSchema, Schema, type } from '@colyseus/schema';
import { WeaponSlotInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CardState } from './CardState';

export class WeaponSlotState extends Schema implements WeaponSlotInfo {
    constructor(id: string) {
        super();

        this.id = id;
    }

    @type('string') readonly id: string;
    @type(CardState) card: CardState | null = null;
    @type({ map: 'number' }) readonly modifiers = new MapSchema<number>();
    @type('number') charge = 0;
    @type('string') noFireReason: string | null = null;
    @type('boolean') primed = false;

    getParameters(): Map<string, number> {
        if (!this.card) {
            return new Map<string, number>();
        }

        const parameters = this.card.getParameters();

        for (const [parameter, adjustment] of this.modifiers) {
            const cardValue = parameters.get(parameter) || 0;
            parameters.set(parameter, cardValue + adjustment);
        }

        return parameters;
    }

    getParameter(parameter: string): number {
        if (!this.card) {
            return 0;
        }

        return this.card.getParameter(parameter) + (this.modifiers.get(parameter) || 0);
    }

    adjustParameter(parameter: string, adjustment: number) {
        const current = this.modifiers.get(parameter) || 0;
        this.modifiers.set(parameter, current + adjustment);
    }

    isCharged(): boolean {
        if (!this.card) {
            return false;
        }

        const chargeRequired = this.getParameter('chargeRequired');

        return this.charge >= chargeRequired;
    }
}
