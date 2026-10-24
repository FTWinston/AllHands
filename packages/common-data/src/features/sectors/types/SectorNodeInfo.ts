import type { EnvironmentType } from './EnvironmentType';
import type { ObjectiveInfo } from './ObjectiveInfo';
import type { IArray } from '@colyseus/react';

/** A station that sells cards for one crew member's deck, as well as repairing like any other station. */
export type ShopStationKind = 'navigationBeacon' | 'weaponsDealer' | 'engineeringOutpost' | 'scienceStation';

/** Every station fully repairs the ship, and lets each crew member view, re-order and sell from their deck. Shop stations also sell cards. */
export type StationKind = 'repair' | ShopStationKind;

export type SectorNodeKind = 'combat' | StationKind | 'boss';

/** Key into the engine's encounter class registry. */
export type EncounterId = string;

export interface SectorNodeInfo {
    id: string;
    kind: SectorNodeKind;
    encounterId: EncounterId;
    name: string;
    /** Absent for stations. */
    environment?: EnvironmentType;
    /** References `FactionConfig.id`. Absent for nodes without hostiles. */
    factionId?: string;
    /** Absent for stations. */
    objective?: ObjectiveInfo;
    /** A tougher combat encounter, bringing an extra heavy cruiser. Known from the outset, for route planning. */
    elite?: boolean;
    /** Normalised 0..1 layout position; x runs start to boss. */
    x: number;
    y: number;
    /** Ids of the nodes reachable from this one. */
    next: IArray<string>;
}
