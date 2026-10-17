import { createRouteCardInfo } from 'common-data/features/sectors/utils/createRouteCardInfo';
import { NonEncounterCardState } from '../state/NonEncounterCardState';
import type { Ship } from '../state/Ship';
import type { RouteCardDetail } from 'common-data/features/cards/types/RouteCardInfo';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';

/** One route card per node: helm gets playable 'basic' cards, science gets 'full' cards it cannot play. */
export function createRouteCards(ship: Ship, nodes: readonly SectorNodeInfo[], detail: RouteCardDetail): NonEncounterCardState[] {
    return nodes.map(node => new NonEncounterCardState(ship.getCardId(), 'route', detail === 'basic', createRouteCardInfo(node, detail)));
}
