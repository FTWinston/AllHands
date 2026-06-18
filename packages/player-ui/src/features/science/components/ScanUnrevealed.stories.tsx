import { Meta, StoryObj } from '@storybook/react';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ScanUnrevealed as Component } from './ScanUnrevealed';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Science/ScanUnrevealed',
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

export const WithSystem: Story = {
    args: {
        system: 'engineer',
    },
};

export const WithoutSystem: Story = {
    args: {
        system: undefined,
    },
};
