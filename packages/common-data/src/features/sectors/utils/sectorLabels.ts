import type { EnvironmentType } from '../types/EnvironmentType';
import type { ObjectiveInfo } from '../types/ObjectiveInfo';
import type { SectorNodeKind } from '../types/SectorNodeInfo';

const environmentLabels: Record<EnvironmentType, string> = {
    deepSpace: 'Deep space',
    asteroidField: 'Asteroid field',
    nebula: 'Nebula',
    gasGiant: 'Gas giant',
};

const nodeKindLabels: Record<SectorNodeKind, string> = {
    combat: 'Combat',
    repair: 'Repair station',
    boss: 'Boss',
};

export function getEnvironmentLabel(environment: EnvironmentType): string {
    return environmentLabels[environment];
}

export function getNodeKindLabel(kind: SectorNodeKind): string {
    return nodeKindLabels[kind];
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

/** Title-cases a faction id such as `deepSpaceRaiders` or `void-raiders`. */
export function getFactionLabel(factionId: string): string {
    const words = factionId.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/[\s_-]+/).filter(Boolean);
    return words.map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
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
