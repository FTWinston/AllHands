import crewStyles from 'common-ui/CrewColors.module.css';
import { fn } from 'storybook/test';
import { WeaponSlot as Component } from './WeaponSlot';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Tactical/WeaponSlot',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        onFired: fn(),
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
        name: 'Weapon slot 1',
        card: null,
    },
};

export const WithCard: Story = {
    args: {
        name: 'Weapon slot 2',
        costToReactivate: 0,
        card: {
            id: 5,
            type: 'exampleWeaponSlotTarget',
        },
    },
};

export const Tapped: Story = {
    args: {
        name: 'Weapon slot 2',
        costToReactivate: 2,
        card: {
            id: 5,
            type: 'exampleWeaponSlotTarget',
        },
    },
};
