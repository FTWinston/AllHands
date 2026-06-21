import { Meta, StoryObj } from '@storybook/react';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ScanUnrevealed as Component } from './ScanUnrevealed';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Science/Scans/Unrevealed',
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
