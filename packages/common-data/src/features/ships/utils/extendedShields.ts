// The Extend Shields card is engineer content, but which ship takes a hit is up to the engine itself (see `Ship.findShieldExtender`), so these live here.

/** How long a ship's shields stay extended over a friendly ship, once the Extend Shields card is played. */
export const extendedShieldsDuration = 10_000;

/** How close a friendly ship has to be for extended shields to cover it, in world units. Staying that close is helm's job. */
export const extendedShieldsRange = 4;
