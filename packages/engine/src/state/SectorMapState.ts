import { ArraySchema, Schema, type } from '@colyseus/schema';
import { SectorMapNodeState } from './SectorMapNodeState';
import type { SectorInfo } from 'common-data/features/sectors/types/SectorInfo';
import type { SectorMapInfo } from 'common-data/features/sectors/types/SectorMapInfo';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';

/**
 * The current sector's graph and position. Only the graph shape and position are synced;
 * what each node holds stays server-side, so players only learn it through science's long range sensors.
 */
export class SectorMapState extends Schema implements SectorMapInfo {
    constructor(sector: SectorInfo, sectorIndex: number, sectorCount: number) {
        super();
        this.sectorId = sector.id;
        this.sectorName = sector.name;
        this.sectorIndex = sectorIndex;
        this.sectorCount = sectorCount;
        this.nodes.push(...sector.nodes.map(node => new SectorMapNodeState(node)));
        this.fullNodes = sector.nodes;
        this.startNodeId = sector.startNodeId;
        this.bossNodeId = sector.bossNodeId;
        this.currentNodeId = this.startNodeId;
        this.moveTo(this.startNodeId);
    }

    @type('string') readonly sectorName: string;
    @type('number') readonly sectorIndex: number;
    @type('number') readonly sectorCount: number;
    @type([SectorMapNodeState]) readonly nodes = new ArraySchema<SectorMapNodeState>();
    /** The sector starts with the ship already at its start node. */
    @type('string') currentNodeId: string;
    @type(['string']) readonly visitedNodeIds = new ArraySchema<string>();
    @type(['string']) readonly availableNodeIds = new ArraySchema<string>();

    /** Server-only: the full node data, including environment, faction and objective. */
    private readonly fullNodes: readonly SectorNodeInfo[];
    readonly sectorId: string;
    readonly startNodeId: string;
    readonly bossNodeId: string;

    getNode(nodeId: string): SectorNodeInfo | undefined {
        return this.fullNodes.find(node => node.id === nodeId);
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
