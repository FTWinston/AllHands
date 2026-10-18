import type { SectorNodeKind } from '../../sectors/types/SectorNodeInfo';

/** The per-instance content of a 'route' card: the sector node it travels to. What the node holds is only shown on science's long range sensors. */
export interface RouteCardInfo {
    nodeId: string;
    nodeKind: SectorNodeKind;
    title: string;
}
