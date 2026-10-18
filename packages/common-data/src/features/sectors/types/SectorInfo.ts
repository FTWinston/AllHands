import type { SectorNodeInfo } from './SectorNodeInfo';

export interface SectorInfo {
    id: string;
    name: string;
    introMessage: string;
    outroMessage: string;
    /** Shown when every player ship is lost in this sector. */
    defeatMessage: string;
    nodes: SectorNodeInfo[];
    /** The repair station each sector starts at. */
    startNodeId: string;
    bossNodeId: string;
}
