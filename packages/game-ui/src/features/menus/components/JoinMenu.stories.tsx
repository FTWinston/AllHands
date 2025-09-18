import { fn } from 'storybook/test';

import { JoinMenu as Component } from './JoinMenu';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
    title: 'game-ui/Menus/JoinMenu',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: {
        joinServer: fn(),
        back: fn(),
    },
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const JoinMenu: Story = {
    args: {},
};
