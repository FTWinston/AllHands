import type { CrewRoleName } from '../../ships/types/CrewRole';
import type { SectorNodeKind, ShopStationKind, StationKind } from '../types/SectorNodeInfo';

/** Which crew member each kind of shop station sells cards to. */
export const shopStationRoles: Readonly<Record<ShopStationKind, CrewRoleName>> = {
    navigationBeacon: 'helm',
    armsDealer: 'tactical',
    salvageYard: 'engineer',
    researchOutpost: 'science',
};

export const shopStationKinds = Object.keys(shopStationRoles) as ShopStationKind[];

export const stationKinds: readonly StationKind[] = ['repair', ...shopStationKinds];

/**
 * Whether the given kind of node is a station, where every crew member can view, re-order and sell from their deck.
 * Stations are technically an encounter whose objective is met on arrival, but crew treat them as being outside an encounter.
 */
export function isStationKind(kind: SectorNodeKind | null | undefined): kind is StationKind {
    return (stationKinds as readonly (SectorNodeKind | null | undefined)[]).includes(kind);
}

/** Whether the given kind of node is a station with a shop, selling cards to one crew member. */
export function isShopStationKind(kind: SectorNodeKind | null | undefined): kind is ShopStationKind {
    return (shopStationKinds as readonly (SectorNodeKind | null | undefined)[]).includes(kind);
}

/** The crew member a station's shop sells cards to, or null if it isn't a shop station. */
export function getShopRole(kind: SectorNodeKind | null | undefined): CrewRoleName | null {
    return isShopStationKind(kind) ? shopStationRoles[kind] : null;
}
