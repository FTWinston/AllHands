import { useState } from 'react';
import { SectorMapDisplay as Component } from './SectorMapDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SectorMapInfo, SectorMapNodeInfo } from 'common-data/features/sectors/types/SectorMapInfo';

/** Positions a node on the map's grid of 7 rows. */
const at = (x: number, row: number) => ({ x, y: row / 6 });

const nodes: SectorMapNodeInfo[] = [
    { id: 'start', kind: 'repair', name: 'Waypoint Station', ...at(0, 3), next: ['n1a', 'n1b', 'n1c'] },
    { id: 'n1a', kind: 'combat', name: 'Skirmish', ...at(0.25, 0), next: ['n2a'] },
    { id: 'n1b', kind: 'combat', name: 'Ambush', ...at(0.25, 3), next: ['n2a', 'n2b'] },
    { id: 'n1c', kind: 'combat', name: 'Survive', ...at(0.25, 5), next: ['n2b'] },
    { id: 'n2a', kind: 'repair', name: 'Repair Station', ...at(0.5, 1), next: ['n3a', 'n3b'] },
    { id: 'n2b', kind: 'combat', name: 'Hold the Line', ...at(0.5, 4), next: ['n3b', 'n3c'] },
    { id: 'n3a', kind: 'combat', name: 'Assault', ...at(0.75, 0), next: ['boss'] },
    { id: 'n3b', kind: 'combat', name: 'Escort', ...at(0.75, 2), next: ['boss'] },
    { id: 'n3c', kind: 'repair', name: 'Repair Station', ...at(0.75, 6), next: ['boss'] },
    { id: 'boss', kind: 'boss', name: 'Placeholder Boss A', ...at(1, 3), next: [] },
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
