import { fn } from 'storybook/test';

import { Button as Component } from './Button';

import type { Meta, StoryObj } from '@storybook/react-vite';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'common-ui/Button',
    component: Component,
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: { onClick: fn() },
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    args: {
        children: 'Button',
    },
};

export const StartIcon: Story = {
    args: {
        children: 'Button',
        startIcon: '😊',
    },
};

export const EndIcon: Story = {
    args: {
        children: 'Button',
        endIcon: '😁',
    },
};

export const BothIcons: Story = {
    args: {
        startIcon: '😊',
        children: 'Button',
        endIcon: '😁',
    },
};
