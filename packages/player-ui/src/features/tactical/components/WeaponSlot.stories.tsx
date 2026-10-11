import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import crewStyles from 'common-ui/CrewColors.module.css';
import { WeaponSlot as Component } from './WeaponSlot';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Tactical/WeaponSlot',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    render: args => (
        <div
            className={crewStyles.tactical}
            style={{ display: 'flex' }}
        >
            <Component {...args} />
        </div>
    ),
    args: {
        modified: false,
        hasBeenFullyCharged: true,
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

const decay = {
    startTime: Date.now(),
    endTime: Date.now() + 10000,
};

export const Empty: Story = {
    args: {
        id: 'slot1',
        card: null,
        charge: 0,
        hasBeenFullyCharged: false,
    },
};

export const WithCard: Story = {
    args: {
        id: 'slot2',
        hasBeenFullyCharged: false,
        charge: 0,
        card: {
            id: 5,
            type: 'phaserStrip',
        },
    },
};

export const PartlyCharged: Story = {
    args: {
        id: 'slot2',
        hasBeenFullyCharged: false,
        charge: 6,
        card: {
            id: 5,
            type: 'phaserStrip',
        },
    },
};

export const Modified: Story = {
    args: {
        id: 'slot2',
        modified: true,
        hasBeenFullyCharged: false,
        charge: 6,
        card: {
            id: 5,
            type: 'phaserStrip',
        },
    },
};

export const ModifiedWithExtraTraits: Story = {
    args: {
        id: 'slot2',
        modified: true,
        charge: 12,
        card: {
            id: 5,
            type: 'phaserStrip',
            extraTraits: {
                dampening: ExtraTraitType.RemoveOnPlay,
                disabling: ExtraTraitType.RemoveOnPlay,
            },
        },
        decay,
    },
};

export const Charged: Story = {
    args: {
        id: 'slot2',
        charge: 12,
        card: {
            id: 5,
            type: 'phaserStrip',
        },
        decay,
    },
};

export const Rechargeable: Story = {
    args: {
        id: 'slot2',
        charge: 2,
        card: {
            id: 5,
            type: 'phaserStrip',
            extraTraits: {
                rechargeable: ExtraTraitType.RemoveOnPlay,
            },
        },
        decay,
    },
};

export const CantFire: Story = {
    args: {
        id: 'slot2',
        charge: 12,
        card: {
            id: 5,
            type: 'phaserStrip',
        },
        decay,
        firingSolution: {
            range: 2000,
            relativeBearing: 0,
            targetAspect: 0,
        },
    },
};
