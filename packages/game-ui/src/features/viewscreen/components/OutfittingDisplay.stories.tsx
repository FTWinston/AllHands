import { Screen } from 'common-ui/components/Screen';
import { OutfittingDisplay as Component } from './OutfittingDisplay';
import { StationDisplay } from './StationDisplay';
import type { Snapshot } from '@colyseus/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { OutfitBundleInfo } from 'common-data/features/cards/types/CardRewardInfo';

const bundles: Snapshot<OutfitBundleInfo>[] = [
    {
        standout: 'tactical',
        cards: [
            { role: 'helm', card: { id: 1, type: 'burn' } },
            { role: 'tactical', card: { id: 2, type: 'photonicCannon' } },
            { role: 'science', card: { id: 3, type: 'tetryonScan' } },
            { role: 'engineer', card: { id: 4, type: 'trickleCharge' } },
        ],
    },
    {
        standout: 'engineer',
        cards: [
            { role: 'helm', card: { id: 5, type: 'sweep' } },
            { role: 'tactical', card: { id: 6, type: 'phaserCannon' } },
            { role: 'science', card: { id: 7, type: 'polaronScan' } },
            { role: 'engineer', card: { id: 8, type: 'extremeMeasures' } },
        ],
    },
    {
        standout: 'helm',
        cards: [
            { role: 'helm', card: { id: 9, type: 'lockOn' } },
            { role: 'tactical', card: { id: 10, type: 'highYield' } },
            { role: 'science', card: { id: 11, type: 'passiveScan' } },
            { role: 'engineer', card: { id: 12, type: 'juryRig' } },
        ],
    },
];

const meta: Meta<typeof Component> = {
    title: 'game-ui/Outfitting Display',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    // Shown in the middle of the station, as on the viewscreen.
    render: args => (
        <Screen>
            <StationDisplay kind="outfitting" name="Outfitting Station A1" antimatter={60} showMenu={() => {}} body={<Component {...args} />} />
        </Screen>
    ),
    args: {
        bundles,
        votes: { helm: 1, tactical: 0, engineer: 1 },
        pickers: [],
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Bundles: Story = {};

export const PickingCards: Story = {
    args: {
        bundles: [],
        votes: {},
        pickers: ['helm', 'engineer'],
    },
};

export const AllPicked: Story = {
    args: {
        bundles: [],
        votes: {},
        pickers: [],
    },
};
