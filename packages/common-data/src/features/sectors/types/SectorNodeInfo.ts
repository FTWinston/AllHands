import type { EnvironmentType } from './EnvironmentType';
import type { ObjectiveInfo } from './ObjectiveInfo';
import type { IArray } from '@colyseus/react';

export type SectorNodeKind = 'combat' | 'repair' | 'boss';

/** Key into the engine's encounter class registry. */
export type EncounterId = string;

export interface SectorNodeInfo {
    id: string;
    kind: SectorNodeKind;
    encounterId: EncounterId;
    name: string;
    /** Absent for repair nodes. */
    environment?: EnvironmentType;
    /** References `FactionConfig.id`. Absent for nodes without hostiles. */
    factionId?: string;
    /** Absent for repair nodes. */
    objective?: ObjectiveInfo;
    /** A tougher combat encounter, bringing an extra heavy cruiser. Known from the outset, for route planning. */
    elite?: boolean;
    /** Normalised 0..1 layout position; x runs start to boss. */
    x: number;
    y: number;
    /** Ids of the nodes reachable from this one. */
    next: IArray<string>;
}
