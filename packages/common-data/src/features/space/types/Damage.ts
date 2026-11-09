import { WeaponTrait } from '../../cards/types/CardTrait';
import { ShipSystem } from '../../ships/types/ShipSystem';

/** Which group a weapon belongs to, which shields can be tuned against. */
export type WeaponType = 'energy' | 'torpedo';

export interface Damage {
    amount: number;
    traits: WeaponTrait[];
    /** Absent for damage that isn't from a weapon. */
    weaponType?: WeaponType;
    targetSystem?: ShipSystem;
}
