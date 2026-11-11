import { WeaponTrait } from '../../cards/types/CardTrait';
import { ShipSystem } from '../../ships/types/ShipSystem';

export interface Damage {
    amount: number;
    traits: WeaponTrait[];
    targetSystem?: ShipSystem;
}
