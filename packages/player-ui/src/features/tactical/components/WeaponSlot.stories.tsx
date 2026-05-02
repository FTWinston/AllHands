import crewStyles from 'common-ui/CrewColors.module.css';
import { WeaponSlot as Component } from './WeaponSlot';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Tactical/WeaponSlot',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    render: args => (
        <div
            className={crewStyles.tactical}
            style={{ display: 'flex' }}
        >
            <Component {...args} />
        </div>
    ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
    args: {
        id: 'slot1',
        card: null,
    },
};

export const WithCard: Story = {
    args: {
        id: 'slot2',
        primed: false,
        charge: 0,
        card: {
            id: 5,
            type: 'phaserStrip',
        },
    },
};

export const Primed: Story = {
    args: {
        id: 'slot2',
        primed: true,
        charge: 2,
        card: {
            id: 5,
            type: 'phaserStrip',
        },
        decay: {
            startTime: Date.now(),
            endTime: Date.now() + 10000,
        },
    },
};

export const Charged: Story = {
    args: {
        id: 'slot2',
        primed: true,
        charge: 4,
        card: {
            id: 5,
            type: 'phaserStrip',
        },
        decay: {
            startTime: Date.now(),
            endTime: Date.now() + 10000,
        },
    },
};

export const CantFire: Story = {
    args: {
        id: 'slot2',
        primed: true,
        charge: 4,
        noFireReason: 'range',
        card: {
            id: 5,
            type: 'phaserStrip',
        },
        decay: {
            startTime: Date.now(),
            endTime: Date.now() + 10000,
        },
    },
};
