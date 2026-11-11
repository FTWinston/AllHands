import { Meta, StoryObj } from '@storybook/react';
import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
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
        appearance: 'swallowtail-interceptor',
        targetNumber: 1,
        totalTargets: 3,
        systemOrder: [3, 2, 1, 4],
        closeRevealedSystem: fn(),
    },
};

export const ScannedHull: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedHull: { targetId: 'Enemy-01', health: 7, maxHealth: 12, shield: 55, maxShield: 80, shieldTuning: 'shieldTunedEnergy' },
    },
};

export const ScannedHull_NoShields: Story = {
    args: {
        ...NoRevealedSystem.args,
        appearance: 'quad-nacelle-courier',
        scannedHull: { targetId: 'Enemy-01', health: 2, maxHealth: 12, shield: 0, maxShield: 80, shieldTuning: null },
    },
};

export const Helm_NoManeuver: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedHelm: {
            targetId: 'Enemy-01',
            power: 3,
            hand: null,
            activeManeuver: null,
            maneuverProgress: null,
            evasionChance: 0,
        },
    },
};

export const Helm_HasManeuver: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedHelm: {
            targetId: 'Enemy-01',
            power: 3,
            hand: null,
            activeManeuver: {
                id: 42,
                type: 'slowAndSteady',
            },
            maneuverProgress: { startTime: Date.now() - 6000, endTime: Date.now() + 4000 },
            evasionChance: 5,
        },
    },
};

export const Helm_LongManeuverName: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedHelm: {
            targetId: 'Enemy-01',
            power: 3,
            hand: null,
            activeManeuver: {
                id: 42,
                type: 'exampleNoTarget',
            },
            maneuverProgress: { startTime: Date.now() - 1000, endTime: Date.now() + 9000 },
            evasionChance: 5,
        },
    },
};

export const Engineer: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedEngineer: {
            targetId: 'Enemy-01',
            power: 3,
            hand: null,
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
            power: 3,
            hand: null,
            weaponSlots: [
                { id: 'slot-1', card: null, charge: 0, modifierCard: null },
                { id: 'slot-2', card: null, charge: 0, modifierCard: null },
            ],
        },
    },
};

export const Tactical_OneWeapon: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedTactical: {
            targetId: 'Enemy-01',
            power: 3,
            hand: null,
            weaponSlots: [
                { id: 'slot-1', card: { id: 3, type: 'phaserStrip' }, charge: 2, modifierCard: null },
                { id: 'slot-2', card: null, charge: 0, modifierCard: null },
            ],
        },
    },
};

export const Tactical_TwoWeapons: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedTactical: {
            targetId: 'Enemy-01',
            power: 3,
            hand: null,
            weaponSlots: [
                { id: 'slot-1', card: { id: 3, type: 'phaserStrip' }, charge: 2, modifierCard: 'overcharge' },
                { id: 'slot-2', card: { id: 4, type: 'photonTorpedo' }, charge: 1, modifierCard: null },
            ],
        },
    },
};

export const Science_Empty: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedScience: {
            targetId: 'Enemy-01',
            power: 3,
            hand: null,
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
            power: 3,
            hand: null,
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
            power: 3,
            hand: null,
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
            power: 3,
            hand: null,
            deflectorCard: {
                id: 7,
                type: 'deflectorCoherentAntiprotonPulse',
            },
            scanSystem: 'engineer',
        },
    },
};

export const Science_Vulnerability: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedScience: {
            targetId: 'Enemy-01',
            power: 3,
            hand: null,
            scanSystem: null,
            deflectorCard: null,
        },
        identifiedVulnerability: 'exampleEnemyTarget',
    },
};

export const Helm_HandRead: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedHelm: {
            ...Helm_HasManeuver.args!.scannedHelm!,
            hand: [
                { id: 51, type: 'strafe' },
                { id: 52, type: 'zigZag' },
                { id: 53, type: 'slowAndSteady' },
            ],
        },
    },
};

export const Helm_HandReadEmpty: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedHelm: {
            ...Helm_HasManeuver.args!.scannedHelm!,
            hand: [],
        },
    },
};

/** The most a scan of one system can show: two weapons, a full hand with a damaged card, and a vulnerability. */
export const Tactical_HandAndVulnerability: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedTactical: {
            ...Tactical_TwoWeapons.args!.scannedTactical!,
            hand: [
                { id: 61, type: 'photonTorpedo' },
                { id: 62, type: 'phaserStrip', extraTraits: { damaged: ExtraTraitType.Normal } },
                { id: 63, type: 'weaponOvercharge' },
                { id: 64, type: 'fullSpread' },
                { id: 65, type: 'lowYield' },
            ],
        },
        identifiedVulnerability: 'exampleEnemyTarget',
    },
};

export const Engineer_HandRead: Story = {
    args: {
        ...NoRevealedSystem.args,
        scannedEngineer: {
            ...Engineer.args!.scannedEngineer!,
            hand: [
                { id: 71, type: 'auxPower' },
            ],
        },
    },
};
