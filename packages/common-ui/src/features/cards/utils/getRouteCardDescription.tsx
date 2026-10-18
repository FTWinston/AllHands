import { RouteIcon } from '../components/CampaignCardIcon';
import type { CardDescription } from '../types/UICardDefinition';
import type { RouteCardInfo } from 'common-data/features/cards/types/RouteCardInfo';

/** Replaces the static name, description and image of a 'route' card with its node's. What the node holds is left to science's long range sensors. */
export function getRouteCardDescription(route: Readonly<RouteCardInfo>): CardDescription {
    return {
        name: route.title,
        description: 'Travel to location',
        image: <RouteIcon nodeKind={route.nodeKind} />,
    };
}
