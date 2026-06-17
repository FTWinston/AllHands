import { Meta, StoryObj } from '@storybook/react';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ScienceTarget as Component } from './ScienceTarget';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Science/Target',
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

export const ScienceTarget: Story = {
    args: {
        id: 'Enemy-01',
        appearance: 'starfighter',
        targetNumber: 1,
        totalTargets: 3,
        systemOrder: [1, 2, 0, 4],
        scannedHelm: {
            targetId: 'Enemy-01',
            activeManeuver: null,
        },
    },
};
