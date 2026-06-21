import { Meta, StoryObj } from '@storybook/react';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ScanEngineerSystem as Component } from './ScanEngineerSystem';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Science/Scans/Engineer',
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

export const Engineer: Story = {
    args: {
        targetId: 'Enemy-01',
        engineerTiles: [
            { system: 'hull', power: 1, health: 5 },
            { system: 'reactor', power: 2, health: 4 },
            { system: 'helm', power: 1, health: 3 },
            { system: 'tactical', power: 3, health: 2 },
            { system: 'engineer', power: 2, health: 1 },
            { system: 'science', power: 0, health: 0 },
        ],
    },
};
