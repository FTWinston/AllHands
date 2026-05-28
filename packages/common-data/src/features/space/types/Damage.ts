import { ShipSystem } from '../../ships/types/ShipSystem';

export type DamageType = 'coherent' | 'disruptor' | 'ion' | 'plasma' | 'antimatter' | 'tachyon';

export const damageTypes: readonly DamageType[] = ['coherent', 'disruptor', 'ion', 'plasma', 'antimatter', 'tachyon'] as const;

export const damageTypeIndex: Record<DamageType, number> = {
    coherent: 1,
    disruptor: 2,
    ion: 3,
    plasma: 4,
    antimatter: 5,
    tachyon: 6,
} as const;

export type DeliveryMethod = 'beam' | 'projectile';

export interface Damage {
    amount: number;
    damageType: DamageType;
    deliveryMethod: DeliveryMethod; // Damage could also come from non-weapon sources, like burst, collision, etc.
    targetSystem?: ShipSystem;
}
