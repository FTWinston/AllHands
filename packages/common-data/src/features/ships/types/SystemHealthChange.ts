import { ShipSystem } from './ShipSystem';

/** Sent to every client on a crew whenever one of their ship's systems is damaged or repaired. */
export interface SystemHealthChange {
    system: ShipSystem;
    /** Negative for damage, positive for repair. */
    change: number;
}
