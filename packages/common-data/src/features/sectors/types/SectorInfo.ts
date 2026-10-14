import type { SectorNodeInfo } from './SectorNodeInfo';

export interface SectorInfo {
    id: string;
    name: string;
    introMessage: string;
    outroMessage: string;
    nodes: SectorNodeInfo[];
    startNodeIds: string[];
    bossNodeId: string;
}
