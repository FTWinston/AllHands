/** Wireframe ship designs, drawn nose-right in the style of the film's tactical schematics. Each is a file of the same name in common-ui. */
export const smallCraftAppearances = [
    'box-wing-patrol',
    'chevron-patrol',
    'crab-gunboat',
    'dart-fighter',
    'hammerhead-patrol',
    'hornet-bomber',
    'kite-scout',
    'lance-interceptor',
    'mantis-drone',
    'quad-nacelle-courier',
    'ring-courier',
    'swallowtail-interceptor',
    'trident-raider',
    'trimaran-cutter',
] as const;

export const capitalShipAppearances = [
    'arrowhead-battlecruiser',
    'brick-battleship',
    'crescent-battlecruiser',
    'diamond-monitor',
    'drop-bay-troopship',
    'drydock-tender',
    'flight-deck-carrier',
    'hammerhead-cruiser',
    'manta-command-ship',
    'outrigger-pod-cruiser',
    'ring-spine-tender',
    'segmented-battleship',
    'spinal-gun-dreadnought',
    'trimaran-frigate',
    'twin-hangar-carrier',
    'wedge-destroyer',
] as const;

/** Haulers, pirates, aliens, mines and other oddities. */
export const unusualShipAppearances = [
    'armed-freighter',
    'cobbled-pirate',
    'crescent-lancer',
    'mining-barge',
    'net-sweeper',
    'ramscoop-collector',
    'ring-vessel',
    'salvage-hauler',
    'seed-pod-alien',
    'segmented-crawler',
    'sentry-drone',
    'smuggler-runner',
    'spiked-mine',
    'tri-radial-alien',
    'tug-and-tow',
] as const;

export const shipAppearances = [...smallCraftAppearances, ...capitalShipAppearances, ...unusualShipAppearances] as const;

export type ShipAppearance = typeof shipAppearances[number];

/** A chevron for the crew's own ship, a circle for anything without a shape of its own, or a ship design. */
export type ObjectAppearance = 'chevron' | 'circle' | ShipAppearance;
