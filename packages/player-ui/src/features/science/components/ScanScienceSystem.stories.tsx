import { Meta, StoryObj } from '@storybook/react';
import crewStyles from 'common-ui/CrewColors.module.css';
import { ScanScienceSystem as Component } from './ScanScienceSystem';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Science/Scans/Science',
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

export const Empty: Story = {
    args: {
        targetId: 'Enemy-01',
        deflectorCard: null,
    },
};

export const DeflectorCard: Story = {
    args: {
        targetId: 'Enemy-01',
        deflectorCard: {
            id: 7,
            type: 'deflectorCoherentAntiprotonPulse',
        },
    },
};

export const ScanTarget: Story = {
    args: {
        targetId: 'Enemy-01',
        deflectorCard: null,
        scanSystems: ['helm'],
    },
};

export const MultipleTargets: Story = {
    args: {
        targetId: 'Enemy-01',
        deflectorCard: null,
        scanSystems: ['helm', 'tactical', 'science', 'engineer'],
    },
};

export const Both: Story = {
    args: {
        targetId: 'Enemy-01',
        deflectorCard: {
            id: 7,
            type: 'deflectorCoherentAntiprotonPulse',
        },
        scanSystems: ['engineer'],
    },
};
