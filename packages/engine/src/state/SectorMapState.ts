import { ArraySchema, Schema, type } from '@colyseus/schema';
import { SectorNodeState } from './SectorNodeState';
import type { SectorInfo } from 'common-data/features/sectors/types/SectorInfo';
import type { SectorMapInfo } from 'common-data/features/sectors/types/SectorMapInfo';

export class SectorMapState extends Schema implements SectorMapInfo {
    constructor(sector: SectorInfo, sectorIndex: number, sectorCount: number) {
        super();
        this.sectorId = sector.id;
        this.sectorName = sector.name;
        this.sectorIndex = sectorIndex;
        this.sectorCount = sectorCount;
        this.nodes.push(...sector.nodes.map(node => new SectorNodeState(node)));
        this.startNodeIds = [...sector.startNodeIds];
        this.bossNodeId = sector.bossNodeId;
        this.setAvailableNodes(this.startNodeIds);
    }

    @type('string') readonly sectorId: string;
    @type('string') readonly sectorName: string;
    @type('number') readonly sectorIndex: number;
    @type('number') readonly sectorCount: number;
    @type([SectorNodeState]) readonly nodes = new ArraySchema<SectorNodeState>();
    @type('string') currentNodeId: string | null = null;
    @type(['string']) readonly visitedNodeIds = new ArraySchema<string>();
    @type(['string']) readonly availableNodeIds = new ArraySchema<string>();

    readonly startNodeIds: readonly string[];
    readonly bossNodeId: string;

    getNode(nodeId: string): SectorNodeState | undefined {
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
        this.availableNodeIds.clear();
        this.availableNodeIds.push(...nodeIds);
    }
}
