import type { StationDepartureStatus } from 'common-data/features/sectors/types/StationDepartureStatus';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';

const crewRoleLabels: Record<CrewRoleName, string> = {
    helm: 'Helm',
    science: 'Science',
    tactical: 'Tactical',
    engineer: 'Engineer',
};

/**
 * What the given viewer should know about leaving the station: who the crew are waiting on, or what the viewer must do themselves.
 * The viewer is a crew member, or null for the viewscreen. Returns null away from a station.
 */
export function getStationDepartureNote(status: StationDepartureStatus | null | undefined, shopRole: CrewRoleName | null, viewer: CrewRoleName | null): string | null {
    switch (status) {
        case 'shopping': {
            if (viewer !== null && viewer === shopRole) {
                return viewer === 'helm'
                    ? 'Close the shop when you\'re done, to get the Warp Away card.'
                    : 'Close the shop when you\'re done, so Helm can warp away.';
            }

            const shopper = shopRole ? crewRoleLabels[shopRole] : 'the crew';
            return viewer === 'helm'
                ? `Waiting for ${shopper} to finish shopping, before you can warp away.`
                : `Waiting for ${shopper} to finish shopping.`;
        }
        case 'ready':
            return viewer === 'helm'
                ? 'Play Warp Away to leave the station.'
                : 'Waiting for Helm to warp away.';
        default:
            return null;
    }
}
