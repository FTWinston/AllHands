import { ShipSystem } from '../../ships/types/ShipSystem';

export type DamageType = 'coherent' | 'disruptor' | 'ion' | 'plasma' | 'antimatter' | 'tachyon';

export type DeliveryMethod = 'beam' | 'projectile';

export interface Damage {
    amount: number;
    damageType: DamageType;
    deliveryMethod: DeliveryMethod; // Damage could also come from non-weapon sources, like burst, collision, etc.
    targetSystem?: ShipSystem;
}
