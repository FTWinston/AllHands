import type { EnvironmentType } from 'common-data/features/sectors/types/EnvironmentType';
import type { EncounterId } from 'common-data/features/sectors/types/SectorNodeInfo';

/** Authored content for one sector; the generator turns it into a map. Each is defined in its own folder under `content/sectors`. */
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

const registeredThemes: SectorTheme[] = [];

/** Every registered sector, in the order they're played. Filled by `registerEngineContent`. */
export const sectorThemes: readonly SectorTheme[] = registeredThemes;

/** Register the given sectors, after any already registered. */
export function registerSectors(themes: readonly SectorTheme[]) {
    for (const theme of themes) {
        if (registeredThemes.some(existing => existing.id === theme.id)) {
            throw new Error(`Sector registered twice: ${theme.id}`);
        }
        registeredThemes.push(theme);
    }
}
