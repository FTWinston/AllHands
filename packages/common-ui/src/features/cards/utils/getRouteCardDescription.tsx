import { Fragment } from 'react';
import { getEnvironmentLabel, getFactionLabel, getNodeKindLabel, getObjectiveLabel } from '../../sectors/utils/sectorLabels';
import { RouteIcon } from '../components/CampaignCardIcon';
import type { CardDescription } from '../types/UICardDefinition';
import type { RouteCardInfo } from 'common-data/features/cards/types/RouteCardInfo';

type Detail = { label: string; value: string };

/** Only 'full' route cards reveal what the node holds. */
export function getRouteCardDetails(route: Readonly<RouteCardInfo>): Detail[] {
    const details: Detail[] = [];
    if (route.detail === 'full') {
        if (route.environment) {
            details.push({ label: 'Environment', value: getEnvironmentLabel(route.environment) });
        }
        if (route.factionId) {
            details.push({ label: 'Hostile', value: getFactionLabel(route.factionId) });
        }
        if (route.objective) {
            details.push({ label: 'Objective', value: getObjectiveLabel(route.objective) });
        }
    }
    return details;
}

/** Replaces the static name, description and image of a 'route' card with its node's content. Basic (helm) cards reveal nothing about the node. */
export function getRouteCardDescription(route: Readonly<RouteCardInfo>): CardDescription {
    return {
        name: route.title,
        description: route.detail === 'full'
            ? (
                <>
                    <b>{getNodeKindLabel(route.nodeKind)}</b>
                    {getRouteCardDetails(route).map(detail => (
                        <Fragment key={detail.label}>
                            <br />
                            <b>{detail.label}</b>
                            {': '}
                            {detail.value}
                        </Fragment>
                    ))}
                </>
            )
            : 'Travel to location',
        image: <RouteIcon nodeKind={route.nodeKind} />,
    };
}
