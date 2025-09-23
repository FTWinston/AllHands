import { CardBack as Component } from './CardBack';
import type { Meta, StoryObj } from '@storybook/react-vite';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'common-ui/Card Back',
    component: Component,
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Helm: Story = {
    args: {
        crew: 'helm',
    },
};

export const Tactical: Story = {
    args: {
        crew: 'tactical',
    },
};

export const Sensors: Story = {
    args: {
        crew: 'sensors',
    },
};

export const Engineering: Story = {
    args: {
        crew: 'engineer',
    },
};
