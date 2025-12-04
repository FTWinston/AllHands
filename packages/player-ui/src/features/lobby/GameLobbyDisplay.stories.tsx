import { engineerClientRole, helmClientRole, sensorClientRole, tacticalClientRole } from 'common-data/features/ships/types/CrewRole';
import { soloCrewIdentifier } from 'common-data/utils/constants';
import { fn } from 'storybook/test';

import { GameLobbyDisplay } from './GameLobbyDisplay';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof GameLobbyDisplay> = {
    title: 'player-ui/Lobby',
    component: GameLobbyDisplay,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Display component for the player lobby where crew members choose their roles and indicate readiness.',
            },
        },
    },
    args: {
        onRoleChange: fn(),
        onReadyChange: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SoloCrewNoRole: Story = {
    args: {
        crewId: soloCrewIdentifier,
        role: null,
        ready: false,
        helmOccupied: false,
        tacticalOccupied: false,
        sensorsOccupied: false,
        engineerOccupied: false,
    },
};

export const SoloCrewPartiallyOccupied: Story = {
    args: {
        crewId: soloCrewIdentifier,
        role: helmClientRole,
        ready: false,
        helmOccupied: true,
        tacticalOccupied: true,
        sensorsOccupied: false,
        engineerOccupied: false,
    },
};

export const SoloCrewReady: Story = {
    args: {
        crewId: soloCrewIdentifier,
        role: tacticalClientRole,
        ready: true,
        helmOccupied: true,
        tacticalOccupied: true,
        sensorsOccupied: true,
        engineerOccupied: true,
    },
};

export const MultipleCrewEmpty: Story = {
    args: {
        crewId: 'ABC',
        role: null,
        ready: false,
        helmOccupied: false,
        tacticalOccupied: false,
        sensorsOccupied: false,
        engineerOccupied: false,
    },
};

export const MultipleCrewPartiallyOccupied: Story = {
    args: {
        crewId: 'ABC',
        role: sensorClientRole,
        ready: false,
        helmOccupied: true,
        tacticalOccupied: false,
        sensorsOccupied: true,
        engineerOccupied: false,
    },
};

export const MultipleCrewReady: Story = {
    args: {
        crewId: 'ABC',
        role: engineerClientRole,
        ready: true,
        helmOccupied: true,
        tacticalOccupied: true,
        sensorsOccupied: true,
        engineerOccupied: true,
    },
};
