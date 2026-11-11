import { getEnvironmentLabel, getObjectiveLabel, getShopLabel } from './sectorLabels';
import type { SectorDestinationInfo } from 'common-data/features/sectors/types/SectorDestinationInfo';

type Detail = { label: string; value: string };

/** What long range sensors list about a destination, omitting anything it lacks (e.g. a station's objective). */
export function getDestinationDetails(destination: Readonly<SectorDestinationInfo>): Detail[] {
    const details: Detail[] = [];
    const shop = getShopLabel(destination.kind);
    if (shop) {
        details.push({ label: 'Sells', value: shop });
    }
    if (destination.environment) {
        details.push({ label: 'Environment', value: getEnvironmentLabel(destination.environment) });
    }
    if (destination.objective) {
        details.push({ label: 'Objective', value: getObjectiveLabel(destination.objective) });
    }
    if (destination.request) {
        details.push({ label: 'Message', value: destination.request });
    }
    return details;
}
