import type { SectorInfo } from 'common-data/features/sectors/types/SectorInfo';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';

/**
 * The current sector's graph and position. Server-only: players learn about the available nodes solely via their route cards.
 */
export class SectorMapState {
    constructor(sector: SectorInfo, readonly sectorIndex: number, readonly sectorCount: number) {
        this.sectorId = sector.id;
        this.sectorName = sector.name;
        this.nodes = sector.nodes;
        this.startNodeIds = [...sector.startNodeIds];
        this.bossNodeId = sector.bossNodeId;
        this.setAvailableNodes(this.startNodeIds);
    }

    readonly sectorId: string;
    readonly sectorName: string;
    readonly nodes: readonly SectorNodeInfo[];
    currentNodeId: string | null = null;
    readonly visitedNodeIds: string[] = [];
    availableNodeIds: string[] = [];

    readonly startNodeIds: readonly string[];
    readonly bossNodeId: string;

    getNode(nodeId: string): SectorNodeInfo | undefined {
        return this.nodes.find(node => node.id === nodeId);
    }

    /** Moves the shared position to a node and makes its successors the next available choices. */
    moveTo(nodeId: string) {
        const node = this.getNode(nodeId);
        if (!node) {
            throw new Error(`Unknown sector node: ${nodeId}`);
        }

        this.currentNodeId = nodeId;
        this.visitedNodeIds.push(nodeId);
        this.setAvailableNodes(node.next);
    }

    private setAvailableNodes(nodeIds: Iterable<string>) {
        this.availableNodeIds = [...nodeIds];
    }
}
