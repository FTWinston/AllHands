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
