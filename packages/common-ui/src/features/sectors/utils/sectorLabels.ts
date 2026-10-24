import { getShopRole } from 'common-data/features/sectors/utils/isStationKind';
import type { EnvironmentType } from 'common-data/features/sectors/types/EnvironmentType';
import type { ObjectiveInfo } from 'common-data/features/sectors/types/ObjectiveInfo';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';

const environmentLabels: Record<EnvironmentType, string> = {
    deepSpace: 'Deep space',
    asteroidField: 'Asteroid field',
    nebula: 'Nebula',
    gasGiant: 'Gas giant',
};

const nodeKindLabels: Record<SectorNodeKind, string> = {
    combat: 'Combat',
    repair: 'Repair station',
    navigationBeacon: 'Navigation beacon',
    armsDealer: 'Arms dealer',
    salvageYard: 'Salvage yard',
    researchOutpost: 'Research outpost',
    boss: 'Boss',
};

/** What each kind of shop station sells. */
const shopLabels: Record<CrewRoleName, string> = {
    helm: 'Helm cards',
    science: 'Science cards',
    tactical: 'Weapon & tactical cards',
    engineer: 'Engineering cards',
};

/** Placeholder names, until the factions are written. */
const factionLabels: Record<string, string> = {
    factionA: 'Faction A',
    factionB: 'Faction B',
    factionC: 'Faction C',
};

export function getEnvironmentLabel(environment: EnvironmentType): string {
    return environmentLabels[environment];
}

export function getNodeKindLabel(kind: SectorNodeKind, elite = false): string {
    return elite ? `Elite ${nodeKindLabels[kind].toLowerCase()}` : nodeKindLabels[kind];
}

export function getObjectiveLabel(objective: ObjectiveInfo): string {
    switch (objective.type) {
        case 'destroyAll':
            return 'Destroy all hostiles';
        case 'survive':
            return `Survive for ${formatDuration(objective.durationMs)}`;
        case 'boss':
            return 'Defeat the boss';
        default:
            throw new Error(`Objective type not found: ${objective satisfies never}`);
    }
}

/** Falls back to the id itself for a faction without a predefined label. */
export function getFactionLabel(factionId: string): string {
    return factionLabels[factionId] ?? factionId;
}

function formatDuration(durationMs: number): string {
    const seconds = Math.round(durationMs / 1000);
    if (seconds < 60) {
        return `${seconds} seconds`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    const minutesText = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    return remainder === 0 ? minutesText : `${minutesText} ${remainder} seconds`;
}

/** What a shop station sells (e.g. "Helm cards"), or null for any other kind of node. */
export function getShopLabel(kind: SectorNodeKind): string | null {
    const role = getShopRole(kind);
    return role ? shopLabels[role] : null;
}
