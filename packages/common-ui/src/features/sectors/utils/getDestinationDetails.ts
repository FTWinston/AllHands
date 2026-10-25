import { getEnvironmentLabel, getFactionLabel, getObjectiveLabel, getShopLabel } from './sectorLabels';
import type { SectorDestinationInfo } from 'common-data/features/sectors/types/SectorDestinationInfo';

type Detail = { label: string; value: string };

/** What long range sensors list about a destination, omitting anything it lacks (e.g. a station's hostiles). */
export function getDestinationDetails(destination: Readonly<SectorDestinationInfo>): Detail[] {
    const details: Detail[] = [];
    const shop = getShopLabel(destination.kind);
    if (shop) {
        details.push({ label: 'Sells', value: shop });
    }
    if (destination.environment) {
        details.push({ label: 'Environment', value: getEnvironmentLabel(destination.environment) });
    }
    if (destination.factionId) {
        details.push({ label: 'Hostile', value: getFactionLabel(destination.factionId) });
    }
    if (destination.objective) {
        details.push({ label: 'Objective', value: getObjectiveLabel(destination.objective) });
    }
    return details;
}
