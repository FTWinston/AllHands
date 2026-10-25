import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';

const crewRoleLabels: Record<CrewRoleName, string> = {
    helm: 'Helm',
    science: 'Science',
    tactical: 'Tactical',
    engineer: 'Engineer',
};

/**
 * Whether the ship can leave the station yet, for the viewscreen.
 * At a shop station, helm only gets the Warp Away card once the shop's crew member closes it (see `PlayerShipInfo.isShopping`).
 */
export function getStationDepartureLabel(shopRole: CrewRoleName | null, isShopping: boolean): string {
    return isShopping && shopRole
        ? `${crewRoleLabels[shopRole]} is shopping`
        : 'Ready to depart';
}
