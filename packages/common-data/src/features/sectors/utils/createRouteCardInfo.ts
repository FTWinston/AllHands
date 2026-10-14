import type { RouteCardDetail, RouteCardInfo } from '../../cards/types/RouteCardInfo';
import type { SectorNodeInfo } from '../types/SectorNodeInfo';

export function createRouteCardInfo(node: SectorNodeInfo, detail: RouteCardDetail): RouteCardInfo {
    const info: RouteCardInfo = {
        nodeId: node.id,
        nodeKind: node.kind,
        title: node.name,
        detail,
    };
    if (detail === 'full') {
        info.environment = node.environment;
        info.factionId = node.factionId;
        info.objective = node.objective;
    }
    return info;
}
