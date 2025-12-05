import { soloCrewIdentifier } from 'common-data/utils/constants';
import { fn } from 'storybook/test';

import { GameLobbyDisplay } from './GameLobbyDisplay';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof GameLobbyDisplay> = {
    title: 'game-ui/Lobby',
    component: GameLobbyDisplay,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Display component for the game lobby that shows crew status, QR code, and connection info.',
            },
        },
    },
    args: {
        disconnect: fn(),
        serverAddress: {
            ip: '192.168.1.100',
            port: 23552,
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleCrewEmpty: Story = {
    args: {
        crewId: soloCrewIdentifier,
        allowMultipleCrews: false,
        helmState: 'unoccupied',
        tacticalState: 'unoccupied',
        sensorsState: 'unoccupied',
        engineerState: 'unoccupied',
        numUnassigned: 0,
        isFull: false,
    },
};

export const SingleCrewPartiallyOccupied: Story = {
    args: {
        crewId: soloCrewIdentifier,
        allowMultipleCrews: false,
        helmState: 'ready',
        tacticalState: 'occupied',
        sensorsState: 'unoccupied',
        engineerState: 'unoccupied',
        numUnassigned: 1,
        isFull: false,
    },
};

export const SingleCrewReady: Story = {
    args: {
        crewId: soloCrewIdentifier,
        allowMultipleCrews: false,
        helmState: 'ready',
        tacticalState: 'ready',
        sensorsState: 'ready',
        engineerState: 'ready',
        isFull: true,
    },
};

export const MultipleCrewEmpty: Story = {
    args: {
        crewId: 'ABC',
        allowMultipleCrews: true,
        helmState: 'unoccupied',
        tacticalState: 'unoccupied',
        sensorsState: 'unoccupied',
        engineerState: 'unoccupied',
        numUnassigned: 0,
        isFull: false,
    },
};

export const MultipleCrewPartiallyOccupied: Story = {
    args: {
        crewId: 'ABC',
        allowMultipleCrews: true,
        helmState: 'ready',
        tacticalState: 'unoccupied',
        sensorsState: 'occupied',
        engineerState: 'unoccupied',
        numUnassigned: 1,
        isFull: false,
    },
};

export const MultipleCrewReady: Story = {
    args: {
        crewId: 'ABC',
        allowMultipleCrews: true,
        helmState: 'ready',
        tacticalState: 'ready',
        sensorsState: 'ready',
        engineerState: 'ready',
        numUnassigned: 0,
        isFull: true,
    },
};
