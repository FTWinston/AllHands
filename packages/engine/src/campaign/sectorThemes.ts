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
    },
];
