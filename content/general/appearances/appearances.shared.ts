import { defineAppearances, defineSharedContent } from 'common-data/content/SharedContent';

/** Ship drawings that no design uses yet. When one does, its drawing moves to the folder of that design. */
export const appearances = defineAppearances({
    'box-wing-patrol': { size: 'small' },
    'chevron-patrol': { size: 'small' },
    'crab-gunboat': { size: 'small' },
    'hammerhead-patrol': { size: 'small' },
    'hornet-bomber': { size: 'small' },
    'kite-scout': { size: 'small' },
    'lance-interceptor': { size: 'small' },
    'quad-nacelle-courier': { size: 'small' },
    'trident-raider': { size: 'small' },
    'arrowhead-battlecruiser': { size: 'capital' },
    'brick-battleship': { size: 'capital' },
    'crescent-battlecruiser': { size: 'capital' },
    'drop-bay-troopship': { size: 'capital' },
    'flight-deck-carrier': { size: 'capital' },
    'segmented-battleship': { size: 'capital' },
    'spinal-gun-dreadnought': { size: 'capital' },
    'trimaran-frigate': { size: 'capital' },
    'twin-hangar-carrier': { size: 'capital' },
    'cobbled-pirate': { size: 'unusual' },
    'crescent-lancer': { size: 'unusual' },
    'net-sweeper': { size: 'unusual' },
    'ramscoop-collector': { size: 'unusual' },
    'salvage-hauler': { size: 'unusual' },
    'seed-pod-alien': { size: 'unusual' },
    'segmented-crawler': { size: 'unusual' },
    'smuggler-runner': { size: 'unusual' },
    'spiked-mine': { size: 'unusual' },
    'tri-radial-alien': { size: 'unusual' },
});

export const appearancesShared = defineSharedContent({ appearances });
