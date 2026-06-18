import { Meta, StoryObj } from '@storybook/react';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ScanScienceSystem as Component } from './ScanScienceSystem';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Science/ScanScienceSystem',
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

export const ScanScienceSystem: Story = {
    args: {
        targetId: 'Enemy-01',
        deflectorCard: {
            id: 7,
            type: 'deflectorCoherentAntiprotonPulse',
        },
    },
};
