import { CrewRole, ownEngineerClientRole, ownHelmClientRole, ownScienceClientRole } from 'common-data/features/ships/types/CrewRole';
import { soloCrewIdentifier } from 'common-data/utils/constants';
import { useState } from 'react';
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
                component: 'Display component for the player lobby where crew members choose their roles. The game starts once every role is claimed.',
            },
        },
    },
    args: {
        onRoleChange: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SoloCrewNoRole: Story = {
    args: {
        crewId: soloCrewIdentifier,
        role: null,
        helmOccupied: false,
        tacticalOccupied: false,
        scienceOccupied: false,
        engineerOccupied: false,
    },
};

export const SoloCrewPartiallyOccupied: Story = {
    args: {
        crewId: soloCrewIdentifier,
        role: ownHelmClientRole,
        helmOccupied: true,
        tacticalOccupied: true,
        scienceOccupied: false,
        engineerOccupied: false,
    },
};

export const MultipleCrewEmpty: Story = {
    args: {
        crewId: 'ABC',
        role: null,
        helmOccupied: false,
        tacticalOccupied: false,
        scienceOccupied: false,
        engineerOccupied: false,
    },
};

export const MultipleCrewPartiallyOccupied: Story = {
    args: {
        crewId: 'ABC',
        role: ownScienceClientRole,
        helmOccupied: true,
        tacticalOccupied: false,
        scienceOccupied: true,
        engineerOccupied: false,
    },
};

export const Interactive: Story = {
    args: {
        crewId: soloCrewIdentifier,
        role: null,
        helmOccupied: false,
        tacticalOccupied: true,
        scienceOccupied: false,
        engineerOccupied: false,
    },
    render: function Render(args) {
        const [role, setRole] = useState<CrewRole | null>(args.role);

        // Tactical is held by someone else; other systems are occupied only by this player.
        return (
            <GameLobbyDisplay
                {...args}
                role={role}
                helmOccupied={role === ownHelmClientRole}
                scienceOccupied={role === ownScienceClientRole}
                engineerOccupied={role === ownEngineerClientRole}
                onRoleChange={(newRole) => {
                    args.onRoleChange(newRole);
                    setRole(newRole === '' ? null : newRole);
                }}
            />
        );
    },
};
