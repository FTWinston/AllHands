import { Meta, StoryObj } from '@storybook/react';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ScanTacticalSystem as Component } from './ScanTacticalSystem';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Science/ScanTacticalSystem',
    component: Component,
    render: (args) => {
        return (
            <ul className={crewStyles.science}>
                <Component
                    {...args}
                />
            </ul>
        );
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const ScanTacticalSystem: Story = {
    args: {
        targetId: 'Enemy-01',
        weaponSlots: [
            { id: 'slot-1', card: { id: 3, type: 'phaserStrip' }, charge: 3 },
            { id: 'slot-2', card: null, charge: 0 },
        ],
    },
};
