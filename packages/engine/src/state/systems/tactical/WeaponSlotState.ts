import { MapSchema, Schema, type } from '@colyseus/schema';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
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
    @type('boolean') modified = false;
    @type('boolean') hasBeenFullyCharged = false;
    @type(CooldownState) decay: CooldownState | null = null;
    decayDuration = 0;

    getParameters(): CardParameters {
        if (!this.card) {
            return { cost: 0 };
        }

        const resolved = this.card.getParameters(this.modifiers);

        for (const [key, value] of Object.entries(resolved)) {
            const min = parameterMinimumValues[key] ?? 0;
            if (value === undefined || value < min) {
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

    /** Until first full charge a weapon takes charge freely; afterwards only a rechargeable weapon can be topped up. */
    canBeCharged(): boolean {
        if (!this.card || this.charge >= this.getParameter('totalCharge')) {
            return false;
        }

        return !this.hasBeenFullyCharged || this.card.hasTrait('rechargeable');
    }

    /** Add charge (up to the weapon's total charge). Decay starts once the weapon is first fully charged. */
    addCharge(amount: number, currentTime: number) {
        if (!this.card) {
            return;
        }

        // Any top-up uses up the trait, so a recharge is a single card.
        if (this.hasBeenFullyCharged) {
            this.card.removeTrait('rechargeable');
        }

        const totalCharge = this.getParameter('totalCharge');
        this.charge = Math.min(this.charge + amount, totalCharge);

        if (!this.hasBeenFullyCharged && this.charge >= totalCharge) {
            this.hasBeenFullyCharged = true;
            this.decayDuration = 30000;
            this.decay = new CooldownState(currentTime, currentTime + this.decayDuration);
        }
    }

    /** Consume one use's charge & reset charge decay. Return true if the weapon was discarded for running out of charge. */
    afterFiring(currentTime: number): boolean {
        this.charge -= this.getParameter('chargePerUse');

        if (this.discardIfEmpty()) {
            return true;
        }

        this.decay = new CooldownState(currentTime, currentTime + this.decayDuration);
        return false;
    }

    /** Decay charge when due. Return true if the weapon was discarded for running out of charge. */
    update(currentTime: number): boolean {
        if (!this.card || !this.decay || this.decay.endTime > currentTime) {
            return false;
        }

        this.decay = new CooldownState(this.decay.endTime, this.decay.endTime + this.decayDuration);
        this.charge -= 1;
        return this.discardIfEmpty();
    }

    private discardIfEmpty(): boolean {
        if (this.charge > 0) {
            return false;
        }

        this.charge = 0;
        this.modified = false;
        this.hasBeenFullyCharged = false;
        this.decay = null;
        this.modifiers.clear();
        this.card = null;
        return true;
    }
}
