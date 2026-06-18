import { Meta, StoryObj } from '@storybook/react';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ScanHelmSystem as Component } from './ScanHelmSystem';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Science/ScanHelmSystem',
    component: Component,
    render: (args) => {
        return (
            <div className={crewStyles.science}>
                <Component
                    {...args}
                />
            </div>
        );
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const NoManeuver: Story = {
    args: {
        targetId: 'Enemy-01',
    },
};

export const HasManeuver: Story = {
    args: {
        targetId: 'Enemy-01',
        activeManeuver: {
            id: 42,
            type: 'slowAndSteady',
        },
    },
};
