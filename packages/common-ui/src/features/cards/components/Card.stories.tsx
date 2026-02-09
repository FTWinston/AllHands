import { Card as Component } from './Card';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
    title: 'common-ui/features/cards/Card',
    component: Component,
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Helm: Story = {
    args: {
        type: 'slowAndSteady',
    },
};

export const Tactical: Story = {
    args: {
        type: 'exampleWeaponTarget',
    },
};

export const Sensors: Story = {
    args: {
        type: 'exampleNoTarget',
    },
};

export const Engineering: Story = {
    args: {
        type: 'auxPower',
    },
};
