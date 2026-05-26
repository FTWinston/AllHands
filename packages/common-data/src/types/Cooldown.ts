export interface Cooldown {
    startTime: number;
    endTime: number;
}

export interface CardCooldown extends Cooldown {
    power: number;
}
