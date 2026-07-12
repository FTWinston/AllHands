import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { WeaponTrait } from 'common-data/features/cards/types/CardTrait';
import { WeaponSlotInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CardState } from 'src/state/CardState';
import { CooldownState } from 'src/state/CooldownState';

/** Minimum resolved values for specific weapon parameters. Parameters not listed here default to 0. */
const parameterMinimumValues: Readonly<Record<string, number>> = {
    damage: 1,
};

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

    @type(['string']) extraTraits = new ArraySchema<WeaponTrait>();

    getParameters(): CardParameters {
        if (!this.card) {
            return { cost: 0 };
        }

        const resolved = this.card.getParameters(this.modifiers);

        for (const key of Object.keys(resolved)) {
            const min = parameterMinimumValues[key] ?? 0;
            if (resolved[key] < min) {
                (resolved as Record<string, number>)[key] = min;
            }
        }

        return resolved;
    }

    getParameter(parameter: string): number {
        if (!this.card) {
            return 0;
        }

        const value = this.card.getParameter(parameter) + (this.modifiers.get(parameter) || 0);
        const min = parameterMinimumValues[parameter] ?? 0;
        return Math.max(min, value);
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
