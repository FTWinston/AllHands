import crewStyles from 'common-ui/CrewColors.module.css';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
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
            crew: 'tactical',
            targetType: 'weapon-slot',
            name: 'Some Card with a longer title',
            description: 'A card that has a particular effect, for a particular crew role.',
            image: <ExampleIcon />,
            cost: 1,
        },
    },
};

export const Tapped: Story = {
    args: {
        name: 'Weapon slot 2',
        costToReactivate: 2,
        card: {
            id: 5,
            crew: 'tactical',
            targetType: 'weapon-slot',
            name: 'Some Card with a longer title',
            description: 'A card that has a particular effect, for a particular crew role.',
            image: <ExampleIcon />,
            cost: 3,
        },
    },
};
