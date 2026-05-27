import { MapSchema, Schema, type } from '@colyseus/schema';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { WeaponSlotInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CardState } from '../../CardState';
import { CooldownState } from '../../CooldownState';

export class WeaponSlotState extends Schema implements WeaponSlotInfo {
    constructor(id: string) {
        super();

        this.id = id;
    }

    @type('string') readonly id: string;
    @type(CardState) card: CardState | null = null;
    @type({ map: 'number' }) readonly modifiers = new MapSchema<number>();
    @type('number') charge = 0;
    @type('boolean') primed = false;
    @type(CooldownState) decay: CooldownState | null = null;
    decayDuration = 0;

    getParameters(): CardParameters {
        if (!this.card) {
            return { cost: 0 };
        }

        return this.card.getParameters(this.modifiers);
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

        const chargeCost = this.getParameter('chargeCost');

        return this.charge >= chargeCost;
    }

    addCharge(amount: number, currentTime: number) {
        if (!this.card) {
            return;
        }

        const chargeCost = this.getParameter('chargeCost');
        this.charge = Math.min(chargeCost, this.charge + amount);

        // If already decaying, set the duration to 1 second faster than it was before, but not dropping below 1 second.
        // If not already decaying, set duration to 30 seconds.
        if (this.decay === null) {
            this.decayDuration = 30000;
        } else {
            this.decayDuration = Math.max(1000, this.decayDuration - 1000);
        }

        // Start or restart the decay process from now.
        this.decay = new CooldownState(currentTime, currentTime + this.decayDuration);
    }

    /** Return true if the weapon card should be discarded. */
    afterFiring() {
        this.charge = 0;
        this.primed = false;
        this.decay = null;

        const usesValue = this.modifiers.get('uses');
        this.modifiers.clear();

        if (usesValue === undefined || usesValue <= 1) {
            this.card = null;
            return true;
        } else {
            this.modifiers.set('uses', usesValue - 1);
            return false;
        }
    }

    update(currentTime: number) {
        if (!this.decay || this.decay.endTime > currentTime) {
            return;
        }

        // If there's charge left, reduce it by 1 and restart the decay. If not, stop the decay.
        if (this.charge <= 1) {
            this.decay = null;
            this.charge = 0;
        } else {
            this.decay = new CooldownState(this.decay.endTime, this.decay.endTime + this.decayDuration);
            this.charge -= 1;
        }
    }
}
