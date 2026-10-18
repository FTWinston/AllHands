import { NonEncounterCardState } from '../state/NonEncounterCardState';
import type { Ship } from '../state/Ship';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';

/** One helm route card per node. */
export function createRouteCards(ship: Ship, nodes: readonly SectorNodeInfo[]): NonEncounterCardState[] {
    return nodes.map(node => new NonEncounterCardState(ship.getCardId(), 'route', { nodeId: node.id, nodeKind: node.kind, title: node.name }));
}
