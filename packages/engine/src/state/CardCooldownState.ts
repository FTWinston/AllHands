import { type } from '@colyseus/schema';
import { CardCooldown } from 'common-data/types/Cooldown';
import { CardState } from './CardState';
import { CooldownState } from './CooldownState';

export class CardCooldownState extends CooldownState implements CardCooldown {
    constructor(card: CardState, startTime: number, endTime: number, power: number) {
        super(startTime, endTime);
        this.card = card;
        this.power = power;
    }

    card: CardState;

    @type('number') power: number;
}
