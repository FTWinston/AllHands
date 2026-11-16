import { MapSchema, Schema, type } from '@colyseus/schema';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { WeaponSlotInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CardState } from 'src/state/CardState';
import { CooldownState } from 'src/state/CooldownState';

/** Minimum resolved values for specific weapon parameters. Parameters not listed here default to 0. */
const parameterMinimumValues: Readonly<Record<string, number>> = {
    damage: 1,
    accuracy: -100,
};

/** How long a weapon that has been fully charged takes to lose each point of charge, in ms. */
export const chargeDecayInterval = 30000;

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
    /** The modifier card played onto this weapon. Not synced to tactical, as only science scans show it. */
    modifierCard: CardType | null = null;
    @type('boolean') hasBeenFullyCharged = false;
    @type(CooldownState) decay: CooldownState | null = null;
    decayDuration = 0;
    /** The id of the target the weapon is active on, if it stays active once fired (see `staysActive`). Empty while it isn't active. */
    @type('string') activeTargetId = '';

    /**
     * Called as an active weapon stops being active, for whatever reason, with its card and the id of the target it was active on.
     * The slot has already been emptied by then. Not synced: the tactical system that holds the slot sets it.
     */
    onDeactivated: ((card: CardState, targetId: string) => void) | null = null;

    /** Whether the weapon in this slot has been fired, and is still active on its target. */
    get isActive(): boolean {
        return this.activeTargetId !== '';
    }

    /**
     * Whether the weapon stays active on its target once fired, rather than spending a use's charge: one with a `drainPerSecond` parameter,
     * which it then loses that much charge each second, until it runs out.
     */
    get staysActive(): boolean {
        return this.getParameter('drainPerSecond') > 0;
    }

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

    /** Put a weapon card into this empty slot. An `energised` weapon comes in fully charged, so its charge starts to decay straight away. */
    insertCard(card: CardState, currentTime: number) {
        this.card = card;

        if (card.hasTrait('energised')) {
            this.receiveCharge(this.getParameter('totalCharge'), currentTime);
        }
    }

    /** Whether a modifier card can be played on this weapon: it needs one loaded, without a modifier yet, that isn't `energised`. */
    canBeModified(): boolean {
        return !!this.card && !this.modified && !this.card.hasTrait('energised');
    }

    /** Until first full charge a weapon takes charge freely. After that, only a rechargeable weapon can be charged, as many times as there's room, even while active. */
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

        this.receiveCharge(amount, currentTime);
    }

    /**
     * Take in charge moved from another weapon (up to the weapon's total charge), and return how much of it fitted.
     * Unlike charging with a card, this works on a weapon that has been fully charged, whether it's rechargeable or not.
     */
    receiveCharge(amount: number, currentTime: number): number {
        if (!this.card) {
            return 0;
        }

        const totalCharge = this.getParameter('totalCharge');
        const received = Math.max(0, Math.min(amount, totalCharge - this.charge));
        this.charge += received;

        if (!this.hasBeenFullyCharged && this.charge >= totalCharge) {
            this.hasBeenFullyCharged = true;
            this.decayDuration = chargeDecayInterval;
            this.decay = new CooldownState(currentTime, currentTime + this.decayDuration);
        }

        return received;
    }

    /** Take charge out of the weapon. Return true if the weapon was discarded: one that has been fully charged is used up when it runs out. */
    removeCharge(amount: number): boolean {
        this.charge = Math.max(0, this.charge - amount);
        return this.hasBeenFullyCharged && this.discardIfEmpty();
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

    /**
     * Make a weapon that stays active once fired (see `staysActive`) active on the target it has just been fired at.
     * Rather than spending a use's charge, it then loses its `drainPerSecond` in charge each second, a point at a time, until it runs out or is otherwise ended.
     */
    activate(targetId: string, currentTime: number) {
        this.activeTargetId = targetId;
        this.decayDuration = 1000 / this.getParameter('drainPerSecond');
        this.decay = new CooldownState(currentTime, currentTime + this.decayDuration);
    }

    /** Decay charge when due, a point for each interval that has passed. Return true if the weapon was discarded for running out of charge. */
    update(currentTime: number): boolean {
        while (this.card && this.decay && this.decayDuration > 0 && this.decay.endTime <= currentTime) {
            this.decay = new CooldownState(this.decay.endTime, this.decay.endTime + this.decayDuration);
            this.charge -= 1;

            if (this.discardIfEmpty()) {
                return true;
            }
        }

        return false;
    }

    /** Empty the slot, losing its charge and any modifier, and ending an active weapon. Return the card that was in it. */
    clear(): CardState | null {
        const card = this.card;
        const activeTargetId = this.activeTargetId;
        this.charge = 0;
        this.modified = false;
        this.modifierCard = null;
        this.hasBeenFullyCharged = false;
        this.decay = null;
        this.activeTargetId = '';
        this.modifiers.clear();
        this.card = null;

        if (card && activeTargetId) {
            this.onDeactivated?.(card, activeTargetId);
        }

        return card;
    }

    private discardIfEmpty(): boolean {
        if (this.charge > 0) {
            return false;
        }

        this.clear();
        return true;
    }
}
