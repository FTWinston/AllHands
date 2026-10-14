import { fn } from 'storybook/test';
import { DevToolsDisplay as Component } from './DevToolsDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'game-ui/Dev Tools',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        isOpen: true,
        addEffect: fn(),
        adjustTimeScale: fn(),
        serverTimeScale: 1,
        loadEncounter: fn(),
        encounters: [
            { id: 'skirmish', name: 'Skirmish', kind: 'combat', environment: 'deepSpace', factionId: 'raiders', objective: { type: 'destroyAll' } },
            { id: 'survive', name: 'Hold the Line', kind: 'combat', environment: 'asteroidField', factionId: 'cartel', objective: { type: 'survive', durationMs: 90000 } },
            { id: 'repairStation', name: 'Repair Station', kind: 'repair' },
            { id: 'bossRaiders', name: 'Raider Warlord', kind: 'boss', environment: 'nebula', factionId: 'raiders', objective: { type: 'boss' } },
        ],
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DevTools: Story = {
    args: {

    },
};

export const Lobby: Story = {
    args: {
        inLobby: true,
    },
};
