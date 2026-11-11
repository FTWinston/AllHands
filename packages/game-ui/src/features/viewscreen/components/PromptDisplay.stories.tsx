import { Screen } from 'common-ui/components/Screen';
import { PromptDisplay as Component } from './PromptDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'game-ui/Prompt Display',
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
