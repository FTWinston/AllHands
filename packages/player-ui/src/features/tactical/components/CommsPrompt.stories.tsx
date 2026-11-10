import { fn } from 'storybook/test';
import { CommsPrompt as Component } from './CommsPrompt';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
    title: 'player-ui/Tactical/Comms Prompt',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        onAnswer: fn(),
    },
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

const now = Date.now();

export const Offer: Story = {
    args: {
        prompt: {
            speaker: 'Stranded Lead',
            text: 'There\'s two hundred of us on a dead hauler, and that ship\'s carrying antibiotics. A third of the stores and we\'re gone. Your call.',
            options: [
                { id: 'handOver', label: 'Hand it over' },
                { id: 'refuse', label: 'Refuse' },
            ],
            countdown: { startTime: now, endTime: now + 20_000 },
        },
    },
};

/** Three answers, and not long to pick one. */
export const ThreeOptions: Story = {
    args: {
        prompt: {
            speaker: 'Mining Station Corvane',
            text: 'We can launch the last two shuttles together, now, or one at a time.',
            options: [
                { id: 'together', label: 'Together' },
                { id: 'inTurn', label: 'One at a time' },
                { id: 'wait', label: 'Hold them' },
            ],
            countdown: { startTime: now, endTime: now + 8000 },
        },
    },
};
