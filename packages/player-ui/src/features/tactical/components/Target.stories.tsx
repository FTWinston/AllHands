import { Meta, StoryObj } from '@storybook/react';
import crewStyles from 'common-ui/CrewColors.module.css';
import { Target as Component } from './Target';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Tactical/Target',
    component: Component,
    render: (args) => {
        return (
            <ul className={crewStyles.tactical}>
                <Component
                    {...args}
                />
            </ul>
        );
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Target: Story = {
    args: {
        id: 'Enemy-01',
        appearance: 'starfighter',
        targetNumber: 1,
        totalTargets: 3,
        vulnerabilities: ['shields', 'engine'],
    },
};
