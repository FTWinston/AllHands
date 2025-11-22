import { fn } from 'storybook/test';

import { Input as Component } from './Input';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
    title: 'common-ui/components/Input',
    component: Component,
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: { onClick: fn() },
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Input: Story = {
    args: {
    },
};
