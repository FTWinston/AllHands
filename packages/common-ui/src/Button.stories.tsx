import type { Meta, StoryObj } from '@storybook/react-vite';

import { fn } from 'storybook/test';

import { Button } from './Button';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'common-ui/Button',
    component: Button,
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: { onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
    args: {
        appearance: 'primary',
        size: 'medium',
        label: 'Button',
    },
};

export const Secondary: Story = {
    args: {
        label: 'Button',
        appearance: 'secondary',
        size: 'medium',
    },
};

export const Large: Story = {
    args: {
        size: 'large',
        appearance: 'primary',
        label: 'Button',
    },
};

export const Small: Story = {
    args: {
        size: 'small',
        appearance: 'primary',
        label: 'Button',
    },
};
