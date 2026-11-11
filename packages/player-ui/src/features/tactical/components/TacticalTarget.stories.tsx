import { Meta, StoryObj } from '@storybook/react';
import crewStyles from 'common-ui/CrewColors.module.css';
import { TacticalTarget as Component } from './TacticalTarget';

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

export const TacticalTarget: Story = {
    args: {
        id: 'Enemy-01',
        appearance: 'swallowtail-interceptor',
        targetNumber: 1,
        totalTargets: 3,
        subTargets: [{ id: 'helm', system: 'helm', aspect: 0 }, { id: 'tactical', system: 'tactical', aspect: Math.PI }],
    },
};

export const ScannedHull: Story = {
    args: {
        ...TacticalTarget.args,
        scannedHull: { targetId: 'Enemy-01', health: 7, maxHealth: 12, shield: 55, maxShield: 80, shieldTuning: 'shieldTunedEnergy' },
    },
};

export const ScannedHull_NoSubTargets: Story = {
    args: {
        ...ScannedHull.args,
        appearance: 'spiked-mine',
        subTargets: [],
        scannedHull: { targetId: 'Enemy-01', health: 12, maxHealth: 12, shield: 100, maxShield: 100, shieldTuning: null },
    },
};
