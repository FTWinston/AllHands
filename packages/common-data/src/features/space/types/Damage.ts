import { ShipSystem } from '../../ships/types/ShipSystem';

export type DamageType = 'coherent' | 'disruptor' | 'ion' | 'plasma' | 'antimatter' | 'tachyon';

export type DeliveryMethod = 'beam' | 'pulse' | 'blast';

export interface Damage {
    amount: number;
    damageType: DamageType;
    deliveryMethod: DeliveryMethod;
    targetSystem?: ShipSystem;
}
