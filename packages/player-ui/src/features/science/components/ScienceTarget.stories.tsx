import { Meta, StoryObj } from '@storybook/react';
import crewStyles from 'common-ui/CrewColors.module.css';
import { fn } from 'storybook/test';
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

export const NoRevealedSystem: Story = {
    args: {
        id: 'Enemy-01',
        name: 'Enemy Ship',
        appearance: 'starfighter',
        targetNumber: 1,
        totalTargets: 3,
        systemOrder: [3, 2, 1, 4],
        closeRevealedSystem: fn(),
    },
};

export const Helm_NoManeuver: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedHelm: {
            targetId: 'Enemy-01',
            activeManeuver: null,
            evasionChance: 0,
        },
    },
};

export const Helm_HasManeuver: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedHelm: {
            targetId: 'Enemy-01',
            activeManeuver: {
                id: 42,
                type: 'slowAndSteady',
            },
            evasionChance: 5,
        },
    },
};

export const Helm_LongManeuverName: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedHelm: {
            targetId: 'Enemy-01',
            activeManeuver: {
                id: 42,
                type: 'exampleNoTarget',
            },
            evasionChance: 5,
        },
    },
};

export const Engineer: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedEngineer: {
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
    },
};

export const Tactical_NoWeapons: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedTactical: {
            targetId: 'Enemy-01',
            weaponSlots: [
                { id: 'slot-1', card: null, charge: 0 },
                { id: 'slot-2', card: null, charge: 0 },
            ],
        },
    },
};

export const Tactical_OneWeapon: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedTactical: {
            targetId: 'Enemy-01',
            weaponSlots: [
                { id: 'slot-1', card: { id: 3, type: 'phaserStrip' }, charge: 2 },
                { id: 'slot-2', card: null, charge: 0 },
            ],
        },
    },
};

export const Tactical_TwoWeapons: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedTactical: {
            targetId: 'Enemy-01',
            weaponSlots: [
                { id: 'slot-1', card: { id: 3, type: 'phaserStrip' }, charge: 2 },
                { id: 'slot-2', card: { id: 4, type: 'photonTorpedo' }, charge: 1 },
            ],
        },
    },
};

export const Science_Empty: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedScience: {
            targetId: 'Enemy-01',
            scanSystem: null,
            deflectorCard: null,
        },
    },
};

export const Science_DeflectorCard: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedScience: {
            targetId: 'Enemy-01',
            scanSystem: null,
            deflectorCard: {
                id: 7,
                type: 'deflectorCoherentAntiprotonPulse',
            },
        },
    },
};

export const Science_ScanTarget: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedScience: {
            targetId: 'Enemy-01',
            deflectorCard: null,
            scanSystem: 'helm',
        },
    },
};

export const Science_Both: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedScience: {
            targetId: 'Enemy-01',
            deflectorCard: {
                id: 7,
                type: 'deflectorCoherentAntiprotonPulse',
            },
            scanSystem: 'engineer',
        },
    },
};
