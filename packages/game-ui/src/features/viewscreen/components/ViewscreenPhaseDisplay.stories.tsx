import { fn } from 'storybook/test';
import { ViewscreenPhaseDisplay as Component } from './ViewscreenPhaseDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'game-ui/Viewscreen Phase Display',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        outcome: null,
        map: null,
        message: null,
        showMenu: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SectorIntro: Story = {
    args: {
        phase: 'sectorIntro',
        message: {
            kind: 'intro',
            title: 'Sector 1: The Frontier',
            text: 'Raider activity has been reported along the border. Stay sharp and keep the ship together.',
        },
    },
};

export const SectorOutro: Story = {
    args: {
        phase: 'sectorOutro',
        message: {
            kind: 'outro',
            title: 'The Frontier secured',
            text: 'The raider warlord is gone. Fleet command is plotting a course to the next sector.',
        },
    },
};

export const Victory: Story = {
    args: { phase: 'sectorOutro', isEnded: true, outcome: 'victory' },
};

export const Defeat: Story = {
    args: { phase: 'encounter', isEnded: true, outcome: 'defeat', message: { kind: 'defeat', title: 'Placeholder Sector 1', text: 'Placeholder defeat message for sector 1.' } },
};

export const SectorMapWithAntimatter: Story = {
    args: {
        phase: 'map',
        antimatter: 40,
        map: {
            sectorName: 'The Frontier',
            sectorIndex: 0,
            sectorCount: 3,
            nodes: [
                { id: 'start', kind: 'repair', name: 'Waypoint Station', gridReference: 'A1', x: 0, y: 0.5, elite: false, next: ['a', 'b'] },
                { id: 'a', kind: 'combat', name: 'Skirmish', gridReference: 'B1', x: 0.5, y: 0, elite: false, next: ['boss'] },
                { id: 'b', kind: 'combat', name: 'Ambush', gridReference: 'B2', x: 0.5, y: 1, elite: true, next: ['boss'] },
                { id: 'boss', kind: 'boss', name: 'Placeholder Boss A', gridReference: 'C1', x: 1, y: 0.5, elite: false, next: [] },
            ],
            currentNodeId: 'start',
            visitedNodeIds: ['start'],
            availableNodeIds: ['a', 'b'],
        },
    },
};
