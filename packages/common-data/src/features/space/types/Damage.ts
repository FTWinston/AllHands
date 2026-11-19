import { WeaponTrait } from '../../cards/types/CardTrait';
import { ShipSystem } from '../../ships/types/ShipSystem';

export interface Damage {
    amount: number;
    traits: WeaponTrait[];
    targetSystem?: ShipSystem;
    /** The id of the ship that fired. */
    sourceId?: string;
    /** Whether the hull takes none of the hit: a hit that would have been shared between a system and the hull all lands on the system, and it never lands on the hull itself. */
    sparesHull?: boolean;
}
