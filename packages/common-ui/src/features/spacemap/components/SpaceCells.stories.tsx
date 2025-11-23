import { SpaceCells as Component } from './SpaceCells';
import type { Meta, StoryObj } from '@storybook/react-vite';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'common-ui/features/spacemap/Space Cells',
    component: Component,
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tiny: Story = {
    args: {
        columns: 3,
        cells: [true, true, true, true, true, true, null, true, null],
    },
};
