import { fn } from 'storybook/test';
import { DevToolsDisplay as Component } from './DevToolsDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'game-ui/Dev Tools',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        isOpen: true,
        addEffect: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DevTools: Story = {
    args: {

    },
};
