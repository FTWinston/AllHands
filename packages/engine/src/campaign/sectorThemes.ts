import type { EnvironmentType } from 'common-data/features/sectors/types/EnvironmentType';
import type { EncounterId } from 'common-data/features/sectors/types/SectorNodeInfo';

/** Authored content for one sector; the generator turns it into a map. */
export interface SectorTheme {
    id: string;
    name: string;
    introMessage: string;
    outroMessage: string;
    defeatMessage: string;
    environments: readonly EnvironmentType[];
    /** What the sector's encounters can be: those in its first few layers come from `early`, and the rest from `late`. An encounter listed more than once turns up more often. */
    encounters: { early: readonly EncounterId[]; late: readonly EncounterId[] };
    bossEncounterId: EncounterId;
}

/** Placeholder fights, which every sector has for now. */
const earlyEncounters: readonly EncounterId[] = ['skirmish', 'ambush', 'survive'];
const lateEncounters: readonly EncounterId[] = ['assault', 'escort', 'survive', 'ambush'];

// All content below is placeholder text, until the campaign is written.
export const sectorThemes: readonly SectorTheme[] = [
    {
        id: 'sector1',
        name: 'Placeholder Sector 1',
        introMessage: 'Placeholder intro message for sector 1.',
        outroMessage: 'Placeholder outro message for sector 1.',
        defeatMessage: 'Placeholder defeat message for sector 1.',
        environments: ['asteroidField', 'deepSpace', 'nebula'],
        encounters: { early: [...earlyEncounters, 'tollCollectors'], late: [...lateEncounters, 'tollCollectors', 'slowBoat', 'standingOrders', 'feverShip', 'deadWeight', 'lastShuttleOut', 'quietRunning'] },
        bossEncounterId: 'quarantineGate',
    },
    {
        id: 'sector2',
        name: 'Placeholder Sector 2',
        introMessage: 'Placeholder intro message for sector 2.',
        outroMessage: 'Placeholder outro message for sector 2.',
        defeatMessage: 'Placeholder defeat message for sector 2.',
        environments: ['nebula', 'gasGiant', 'deepSpace'],
        encounters: { early: earlyEncounters, late: lateEncounters },
        bossEncounterId: 'bossB',
    },
    {
        id: 'sector3',
        name: 'Placeholder Sector 3',
        introMessage: 'Placeholder intro message for sector 3.',
        outroMessage: 'Placeholder outro message for sector 3.',
        defeatMessage: 'Placeholder defeat message for sector 3.',
        environments: ['deepSpace', 'gasGiant', 'asteroidField'],
        encounters: { early: earlyEncounters, late: lateEncounters },
        bossEncounterId: 'bossC',
    },
];
