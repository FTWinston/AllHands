import { fn } from 'storybook/test';

import { ToggleButton as Component } from './ToggleButton';

import type { Meta, StoryObj } from '@storybook/react-vite';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'common-ui/components/Toggle Button',
    component: Component,
    args: { onPressedChanged: fn() },
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const ToggleButton: Story = {
    args: {
        children: 'Toggle Button',
        pressed: false,
        onPressedChanged: fn(),
    },
};
