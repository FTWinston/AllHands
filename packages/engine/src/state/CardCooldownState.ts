import { type } from '@colyseus/schema';
import { CardCooldown } from 'common-data/types/Cooldown';
import { CooldownState } from './CooldownState';

export class CardCooldownState extends CooldownState implements CardCooldown {
    constructor(startTime: number, endTime: number, power: number) {
        super(startTime, endTime);
        this.power = power;
    }

    @type('number') power: number;
}
