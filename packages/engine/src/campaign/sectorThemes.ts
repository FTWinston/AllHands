import type { EnvironmentType } from 'common-data/features/sectors/types/EnvironmentType';
import type { EncounterId } from 'common-data/features/sectors/types/SectorNodeInfo';

/** Authored content for one sector; the generator turns it into a map. */
export interface SectorTheme {
    id: string;
    name: string;
    introMessage: string;
    outroMessage: string;
    defeatMessage: string;
    /** Hostile faction that populates the sector's combat nodes and boss. */
    factionId: string;
    environments: readonly EnvironmentType[];
    bossEncounterId: EncounterId;
    locationNames: readonly string[];
    stationNames: readonly string[];
}

// All content below is placeholder text, until the campaign is written.
export const sectorThemes: readonly SectorTheme[] = [
    {
        id: 'sector1',
        name: 'Placeholder Sector 1',
        introMessage: 'Placeholder intro message for sector 1.',
        outroMessage: 'Placeholder outro message for sector 1.',
        defeatMessage: 'Placeholder defeat message for sector 1.',
        factionId: 'factionA',
        environments: ['asteroidField', 'deepSpace', 'nebula'],
        bossEncounterId: 'bossA',
        locationNames: [
            'Location 1-1', 'Location 1-2', 'Location 1-3', 'Location 1-4', 'Location 1-5', 'Location 1-6', 'Location 1-7', 'Location 1-8',
            'Location 1-9', 'Location 1-10', 'Location 1-11', 'Location 1-12', 'Location 1-13', 'Location 1-14', 'Location 1-15', 'Location 1-16',
        ],
        stationNames: ['Station 1-1', 'Station 1-2', 'Station 1-3', 'Station 1-4'],
    },
    {
        id: 'sector2',
        name: 'Placeholder Sector 2',
        introMessage: 'Placeholder intro message for sector 2.',
        outroMessage: 'Placeholder outro message for sector 2.',
        defeatMessage: 'Placeholder defeat message for sector 2.',
        factionId: 'factionB',
        environments: ['nebula', 'gasGiant', 'deepSpace'],
        bossEncounterId: 'bossB',
        locationNames: [
            'Location 2-1', 'Location 2-2', 'Location 2-3', 'Location 2-4', 'Location 2-5', 'Location 2-6', 'Location 2-7', 'Location 2-8',
            'Location 2-9', 'Location 2-10', 'Location 2-11', 'Location 2-12', 'Location 2-13', 'Location 2-14', 'Location 2-15', 'Location 2-16',
        ],
        stationNames: ['Station 2-1', 'Station 2-2', 'Station 2-3', 'Station 2-4'],
    },
    {
        id: 'sector3',
        name: 'Placeholder Sector 3',
        introMessage: 'Placeholder intro message for sector 3.',
        outroMessage: 'Placeholder outro message for sector 3.',
        defeatMessage: 'Placeholder defeat message for sector 3.',
        factionId: 'factionC',
        environments: ['deepSpace', 'gasGiant', 'asteroidField'],
        bossEncounterId: 'bossC',
        locationNames: [
            'Location 3-1', 'Location 3-2', 'Location 3-3', 'Location 3-4', 'Location 3-5', 'Location 3-6', 'Location 3-7', 'Location 3-8',
            'Location 3-9', 'Location 3-10', 'Location 3-11', 'Location 3-12', 'Location 3-13', 'Location 3-14', 'Location 3-15', 'Location 3-16',
        ],
        stationNames: ['Station 3-1', 'Station 3-2', 'Station 3-3', 'Station 3-4'],
    },
];
