import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';

const crewRoleLabels: Record<CrewRoleName, string> = {
    helm: 'Helm',
    science: 'Science',
    tactical: 'Tactical',
    engineer: 'Engineer',
};

/**
 * Whether the crew can leave the station yet, for the viewscreen. A shop station's encounter only completes,
 * giving helm the Warp Away card, once its crew member first closes their shop.
 */
export function getStationDepartureLabel(shopRole: CrewRoleName | null, objectiveMet: boolean): string {
    return objectiveMet || !shopRole
        ? 'Ready to depart'
        : `${crewRoleLabels[shopRole]} is shopping`;
}
