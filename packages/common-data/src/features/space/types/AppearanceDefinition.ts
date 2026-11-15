/** How big a ship design is: a small craft, a capital ship, or something unusual (a hauler, a station, an alien). Explosions are sized by it. */
export type ShipSize = 'small' | 'capital' | 'unusual';

/** A ship drawing that designs can use as their appearance. Each is an svg of the same name, drawn nose-right, in its content folder. */
export interface AppearanceDefinition {
    size: ShipSize;
}
