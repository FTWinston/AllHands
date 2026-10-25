import { useState } from 'react';
import { SectorMapDisplay as Component } from './SectorMapDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SectorMapInfo, SectorMapNodeInfo } from 'common-data/features/sectors/types/SectorMapInfo';

/** Positions a regular node on the map's grid of 7 rows. */
const at = (x: number, row: number) => ({ x, y: row / 6, elite: false });

const nodes: SectorMapNodeInfo[] = [
    { id: 'start', kind: 'repair', name: 'Waypoint Station', gridReference: 'A1', ...at(0, 3), next: ['n1a', 'n1b', 'n1c'] },
    { id: 'n1a', kind: 'combat', name: 'Skirmish', gridReference: 'B1', ...at(0.25, 0), next: ['n2a'] },
    { id: 'n1b', kind: 'combat', name: 'Ambush', gridReference: 'B2', ...at(0.25, 3), next: ['n2a', 'n2b'] },
    { id: 'n1c', kind: 'combat', name: 'Survive', gridReference: 'B3', ...at(0.25, 5), next: ['n2b'] },
    { id: 'n2a', kind: 'armsDealer', name: 'Arms Dealer', gridReference: 'C1', ...at(0.5, 1), next: ['n3a', 'n3b'] },
    { id: 'n2b', kind: 'combat', name: 'Hold the Line', gridReference: 'C2', ...at(0.5, 4), elite: true, next: ['n3b', 'n3c'] },
    { id: 'n3a', kind: 'combat', name: 'Assault', gridReference: 'D1', ...at(0.75, 0), next: ['boss'] },
    { id: 'n3b', kind: 'combat', name: 'Escort', gridReference: 'D2', ...at(0.75, 2), elite: true, next: ['boss'] },
    { id: 'n3c', kind: 'researchOutpost', name: 'Research Outpost', gridReference: 'D3', ...at(0.75, 6), next: ['boss'] },
    { id: 'boss', kind: 'boss', name: 'Placeholder Boss A', gridReference: 'E1', ...at(1, 3), next: [] },
];

const baseMap: SectorMapInfo = {
    sectorName: 'The Frontier',
    sectorIndex: 0,
    sectorCount: 3,
    nodes,
    currentNodeId: 'start',
    visitedNodeIds: ['start'],
    availableNodeIds: ['n1a', 'n1b', 'n1c'],
};

const meta: Meta<typeof Component> = {
    title: 'game-ui/Sector Map',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    decorators: [
        Story => (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SectorStart: Story = {
    args: { map: baseMap },
};

export const MidSector: Story = {
    args: {
        map: {
            ...baseMap,
            sectorIndex: 1,
            currentNodeId: 'n2b',
            visitedNodeIds: ['start', 'n1b', 'n2b'],
            availableNodeIds: ['n3b', 'n3c'],
        },
    },
};

export const BossAvailable: Story = {
    args: {
        map: {
            ...baseMap,
            sectorIndex: 2,
            currentNodeId: 'n3c',
            visitedNodeIds: ['start', 'n1c', 'n2b', 'n3c'],
            availableNodeIds: ['boss'],
        },
    },
};

/** Positions a node of a full-size sector, in one of its 10 layers and 7 rows. */
const cell = (layer: number, row: number, elite = false) => ({ x: layer / 9, y: row / 6, elite });

/** A full-size sector like those the engine generates: shop stations sit on parallel branches, so most routes pass two or three, but there are more to pick from. */
const fullSectorNodes: SectorMapNodeInfo[] = [
    { id: '0', kind: 'repair', name: 'Waypoint Station', gridReference: 'A1', ...cell(0, 3), next: ['1a', '1b'] },
    { id: '1a', kind: 'combat', name: 'Skirmish', gridReference: 'B1', ...cell(1, 2), next: ['2a', '2b'] },
    { id: '1b', kind: 'combat', name: 'Ambush', gridReference: 'B2', ...cell(1, 3), next: ['2c'] },
    { id: '2a', kind: 'researchOutpost', name: 'Research Outpost', gridReference: 'C1', ...cell(2, 1), next: ['3a', '3b'] },
    { id: '2b', kind: 'navigationBeacon', name: 'Beacon', gridReference: 'C2', ...cell(2, 2), next: ['3b', '3c'] },
    { id: '2c', kind: 'combat', name: 'Hold the Line', gridReference: 'C3', ...cell(2, 3, true), next: ['3c', '3d'] },
    { id: '3a', kind: 'combat', name: 'Survive', gridReference: 'D1', ...cell(3, 1), next: ['4a', '4b'] },
    { id: '3b', kind: 'combat', name: 'Assault', gridReference: 'D2', ...cell(3, 2), next: ['4b', '4c'] },
    { id: '3c', kind: 'combat', name: 'Escort', gridReference: 'D3', ...cell(3, 3), next: ['4c', '4d', '4e'] },
    { id: '3d', kind: 'navigationBeacon', name: 'Relay Beacon', gridReference: 'D4', ...cell(3, 4), next: ['4e'] },
    { id: '4a', kind: 'navigationBeacon', name: 'Lighthouse', gridReference: 'E1', ...cell(4, 0), next: ['5a'] },
    { id: '4b', kind: 'salvageYard', name: 'Salvage Yard', gridReference: 'E2', ...cell(4, 1), next: ['5a', '5b'] },
    { id: '4c', kind: 'armsDealer', name: 'Arms Dealer', gridReference: 'E3', ...cell(4, 2), next: ['5b', '5c'] },
    { id: '4d', kind: 'researchOutpost', name: 'Observatory', gridReference: 'E4', ...cell(4, 3), next: ['5c'] },
    { id: '4e', kind: 'combat', name: 'Gauntlet', gridReference: 'E5', ...cell(4, 4, true), next: ['5d'] },
    { id: '5a', kind: 'combat', name: 'Blockade', gridReference: 'F1', ...cell(5, 1, true), next: ['6a'] },
    { id: '5b', kind: 'combat', name: 'Patrol', gridReference: 'F2', ...cell(5, 2), next: ['6a', '6b'] },
    { id: '5c', kind: 'combat', name: 'Raid', gridReference: 'F3', ...cell(5, 3, true), next: ['6b'] },
    { id: '5d', kind: 'combat', name: 'Pursuit', gridReference: 'F4', ...cell(5, 4), next: ['6c'] },
    { id: '6a', kind: 'armsDealer', name: 'Armoury', gridReference: 'G1', ...cell(6, 2), next: ['7a'] },
    { id: '6b', kind: 'salvageYard', name: 'Shipyard', gridReference: 'G2', ...cell(6, 3), next: ['7b'] },
    { id: '6c', kind: 'salvageYard', name: 'Salvage Yard', gridReference: 'G3', ...cell(6, 4), next: ['7c'] },
    { id: '7a', kind: 'combat', name: 'Interception', gridReference: 'H1', ...cell(7, 2), next: ['8'] },
    { id: '7b', kind: 'combat', name: 'Crossfire', gridReference: 'H2', ...cell(7, 3), next: ['8'] },
    { id: '7c', kind: 'combat', name: 'Last Stand', gridReference: 'H3', ...cell(7, 4), next: ['8'] },
    { id: '8', kind: 'repair', name: 'Forward Repair Station', gridReference: 'I1', ...cell(8, 3), next: ['9'] },
    { id: '9', kind: 'boss', name: 'Placeholder Boss A', gridReference: 'J1', ...cell(9, 3), next: [] },
];

export const FullSector: Story = {
    args: {
        map: {
            ...baseMap,
            nodes: fullSectorNodes,
            currentNodeId: '0',
            visitedNodeIds: ['0'],
            availableNodeIds: ['1a', '1b'],
        },
    },
};

export const Interactive: Story = {
    args: { map: baseMap },
    render: (args) => {
        const [map, setMap] = useState<SectorMapInfo>(args.map);

        const select = (nodeId: string) => {
            const node = map.nodes.find(n => n.id === nodeId);
            if (node) {
                setMap({ ...map, currentNodeId: nodeId, visitedNodeIds: [...map.visitedNodeIds, nodeId], availableNodeIds: node.next });
            }
        };

        return (
            <>
                <Component map={map} />
                <div style={{ position: 'absolute', bottom: 8, left: 8 }}>
                    {map.availableNodeIds.map(id => (
                        <button key={id} onClick={() => select(id)}>{`Go to ${id}`}</button>
                    ))}
                </div>
            </>
        );
    },
};
