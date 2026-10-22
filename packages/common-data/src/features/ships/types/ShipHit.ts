/** Sent to every client on a crew whenever their ship is hit. */
export interface ShipHit {
    /** How much damage got through the shields. Zero if they absorbed it all. */
    damage: number;
}
