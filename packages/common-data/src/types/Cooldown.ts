import { CardInstance } from 'src/features/cards/types/CardInstance';

export interface Cooldown {
    startTime: number;
    endTime: number;
}

export interface CardCooldown extends Cooldown {
    power: number;
    card: CardInstance;
}
