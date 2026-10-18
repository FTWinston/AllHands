import { fn } from 'storybook/test';
import { SectorMessagePrompt as Component } from './SectorMessagePrompt';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
    title: 'player-ui/Tactical/Sector Message Prompt',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        onDismiss: fn(),
    },
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Intro: Story = {
    args: {
        message: {
            kind: 'intro',
            title: 'Sector 1: The Ember Reach',
            text: 'Long-range scans show raider activity ahead.\nStay sharp.',
        },
    },
};

export const WithoutMessage: Story = {
    args: {
        message: null,
    },
};
