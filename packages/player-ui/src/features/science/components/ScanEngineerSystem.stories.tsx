import { Meta, StoryObj } from '@storybook/react';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ScanEngineerSystem as Component } from './ScanEngineerSystem';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Science/ScanEngineerSystem',
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

export const ScanEngineerSystem: Story = {
    args: {
        targetId: 'Enemy-01',
        engineerTiles: [
            { system: 'hull', power: 1, health: 0.8 },
            { system: 'reactor', power: 2, health: 1.0 },
            { system: 'helm', power: 1, health: 0.5 },
        ],
    },
};
