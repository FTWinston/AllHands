import { Meta, StoryObj } from '@storybook/react';
import crewStyles from 'common-ui/CrewColors.module.css';
import { LongRangeSensorList as Component } from './LongRangeSensorList';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Science/Long Range Sensors',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    render: args => (
        <div className={crewStyles.science}>
            <Component {...args} />
        </div>
    ),
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Destinations: Story = {
    args: {
        destinations: [
            { id: 'n1a', kind: 'combat', name: 'Ember Belt', environment: 'asteroidField', factionId: 'factionA', objective: { type: 'destroyAll' } },
            { id: 'n1b', kind: 'combat', name: 'Hold the Line', environment: 'nebula', factionId: 'factionB', objective: { type: 'survive', durationMs: 90000 } },
            { id: 'n1c', kind: 'repair', name: 'Repair Station' },
            { id: 'n1d', kind: 'salvageYard', name: 'Salvage Yard E1' },
            { id: 'boss', kind: 'boss', name: 'Placeholder Boss A', environment: 'gasGiant', factionId: 'factionA', objective: { type: 'boss' } },
        ],
    },
};

export const NoDestinations: Story = {
    args: {
        destinations: [],
    },
};
