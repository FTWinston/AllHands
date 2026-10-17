import { useState } from 'react';
import { SectorMapDisplay as Component } from './SectorMapDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SectorMapInfo, SectorMapNodeInfo } from 'common-data/features/sectors/types/SectorMapInfo';

const nodes: SectorMapNodeInfo[] = [
    { id: 'n0a', kind: 'combat', x: 0, y: 0.25, next: ['n1a', 'n1b'] },
    { id: 'n0b', kind: 'combat', x: 0, y: 0.75, next: ['n1b'] },
    { id: 'n1a', kind: 'repair', x: 0.33, y: 0.15, next: ['n2a'] },
    { id: 'n1b', kind: 'combat', x: 0.33, y: 0.7, next: ['n2a', 'n2b'] },
    { id: 'n2a', kind: 'combat', x: 0.66, y: 0.3, next: ['boss'] },
    { id: 'n2b', kind: 'repair', x: 0.66, y: 0.85, next: ['boss'] },
    { id: 'boss', kind: 'boss', x: 1, y: 0.5, next: [] },
];

const baseMap: SectorMapInfo = {
    sectorName: 'The Frontier',
    sectorIndex: 0,
    sectorCount: 3,
    nodes,
    currentNodeId: null,
    visitedNodeIds: [],
    availableNodeIds: ['n0a', 'n0b'],
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
            currentNodeId: 'n1b',
            visitedNodeIds: ['n0b', 'n1b'],
            availableNodeIds: ['n2a', 'n2b'],
        },
    },
};

export const BossAvailable: Story = {
    args: {
        map: {
            ...baseMap,
            sectorIndex: 2,
            currentNodeId: 'n2b',
            visitedNodeIds: ['n0a', 'n1b', 'n2b'],
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
