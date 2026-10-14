import type { EnvironmentType } from 'common-data/features/sectors/types/EnvironmentType';
import type { EncounterId } from 'common-data/features/sectors/types/SectorNodeInfo';

/** Authored content for one sector; the generator turns it into a map. */
export interface SectorTheme {
    id: string;
    name: string;
    introMessage: string;
    outroMessage: string;
    /** Hostile faction that populates the sector's combat nodes and boss. */
    factionId: string;
    environments: readonly EnvironmentType[];
    bossEncounterId: EncounterId;
    locationNames: readonly string[];
    stationNames: readonly string[];
}

export const sectorThemes: readonly SectorTheme[] = [
    {
        id: 'scrapfields',
        name: 'The Scrapfields',
        introMessage: 'Long-range scans show the Scrapfields littered with the wreckage of a dozen wars, and raider crews picking it clean. Their warlord has sworn to strip every passing ship for parts. Plot a course through the debris, and be ready for company.',
        outroMessage: 'The warlord\'s flagship is a drifting hulk, and the raider fleet has scattered to the winds. The way out of the Scrapfields lies open. Beyond it waits the Gilded Reach, where the cartels charge a toll for everything.',
        factionId: 'raiders',
        environments: ['asteroidField', 'deepSpace', 'nebula'],
        bossEncounterId: 'bossRaiders',
        locationNames: [
            'Rustwater Drift', 'Slag Heap', 'Hull Graveyard', 'Cinder Belt', 'Gantry Ruins', 'Bent Spar', 'Salvage Row', 'Ash Cairn',
            'Ironbite Shoal', 'Dead Relay', 'Scorch Ring', 'Tangle Reef', 'Hollow Anvil', 'Wreck of the Persistence', 'Grit Narrows', 'Cold Forge',
        ],
        stationNames: ['Patchwork Dock', 'Tinker\'s Rest', 'Welders\' Haven', 'Mend Point'],
    },
    {
        id: 'gildedReach',
        name: 'The Gilded Reach',
        introMessage: 'The Gilded Reach glitters with beacon-lit trade lanes, every one of them owned. The Cartel\'s enforcers have been told to expect you, and the syndicate\'s flagship watches the far end of the lane. Pay no toll. Take no prisoners.',
        outroMessage: 'The Golden Toll has gone dark, and with it the Cartel\'s grip on the Reach. Merchants are already broadcasting thanks on every open channel. Ahead lie the Hegemony Marches, and the fleet that has been waiting for you.',
        factionId: 'cartel',
        environments: ['nebula', 'gasGiant', 'deepSpace'],
        bossEncounterId: 'bossCartel',
        locationNames: [
            'Gilt Junction', 'Toll Gate Nine', 'Auric Shallows', 'Brokerage Deep', 'Lantern Lane', 'Customs Anchorage', 'Velvet Vortex', 'Ledger Point',
            'Silk Meridian', 'Counting House', 'Bullion Spur', 'Prism Haze', 'Opal Passage', 'Brass Orbit', 'Tariff Station Gamma', 'Mirrorgate',
        ],
        stationNames: ['Free Port Calloway', 'Honest Dock', 'Quiet Berth', 'Neutral Ground'],
    },
    {
        id: 'hegemonyMarches',
        name: 'The Hegemony Marches',
        introMessage: 'The Marches are the Hegemony\'s last line, and its fleets hold every approach to the core. There is no more room to run. Break the Dominion of Steel and the war ends here.',
        outroMessage: 'The Dominion of Steel breaks apart in a cascade of fire, and the Hegemony fleet stands down across the Marches. The long road is finished, and the ship and her crew are still flying. Well done.',
        factionId: 'hegemony',
        environments: ['deepSpace', 'gasGiant', 'asteroidField'],
        bossEncounterId: 'bossHegemony',
        locationNames: [
            'Bastion Approach', 'Picket Line Seven', 'Sentinel Reach', 'Ordnance Yard', 'Standing Wall', 'Garrison Verge', 'Iron Crown', 'Muster Field',
            'Citadel Shadow', 'Vigil Station', 'Lancer\'s Gap', 'Bulwark Deep', 'Parade Ground', 'Hammer Rise', 'Cordon Delta', 'Final Rampart',
        ],
        stationNames: ['Last Light Depot', 'Forward Dock Theta', 'Field Hospital Ship', 'Reserve Anchorage'],
    },
];
