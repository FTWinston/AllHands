import { Screen } from 'common-ui/components/Screen';
import { getStationDepartureNote } from 'common-ui/features/sectors/utils/stationDepartureLabels';
import { expect, within } from 'storybook/test';
import { StationBanner as Component } from './StationBanner';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'game-ui/Station Banner',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    decorators: [
        Story => (
            <Screen>
                <Story />
            </Screen>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const RepairStation: Story = {
    args: { kind: 'repair', name: 'Repair Station 1-1' },
};

export const NavigationBeacon: Story = {
    args: { kind: 'navigationBeacon', name: 'Beacon 1-1' },
};

export const ArmsDealer: Story = {
    args: { kind: 'armsDealer', name: 'Arms Dealer 1-1' },
};

export const SalvageYard: Story = {
    args: { kind: 'salvageYard', name: 'Salvage Yard 1-1' },
};

export const ResearchOutpost: Story = {
    args: { kind: 'researchOutpost', name: 'Research Outpost 1-1' },
};

export const WaitingForShopper: Story = {
    args: { kind: 'armsDealer', name: 'Arms Dealer 1-1', departure: getStationDepartureNote('shopping', 'tactical', null) },
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByText('Waiting for Tactical to finish shopping.')).toBeInTheDocument();
    },
};

export const WaitingForHelm: Story = {
    args: { kind: 'repair', name: 'Repair Station 1-1', departure: getStationDepartureNote('ready', null, null) },
};
