import type { EnvironmentType } from '../../sectors/types/EnvironmentType';
import type { ObjectiveInfo } from '../../sectors/types/ObjectiveInfo';
import type { SectorNodeKind } from '../../sectors/types/SectorNodeInfo';

/** 'basic' shows only the title; 'full' also fills environment, factionId and objective. */
export type RouteCardDetail = 'basic' | 'full';

/** The per-instance content of a 'route' card: the sector node it travels to. */
export interface RouteCardInfo {
    nodeId: string;
    nodeKind: SectorNodeKind;
    title: string;
    detail: RouteCardDetail;
    environment?: EnvironmentType;
    factionId?: string;
    objective?: ObjectiveInfo;
}
