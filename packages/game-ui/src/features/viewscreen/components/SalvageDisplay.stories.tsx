import { Screen } from 'common-ui/components/Screen';
import { SalvageDisplay as Component } from './SalvageDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'game-ui/Salvage Display',
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
    args: {
        chooser: 'science',
        cards: [
            { role: 'helm', card: { id: 401, type: 'burn' }, deckSize: 9, maxDeckSize: 12 },
            { role: 'tactical', card: { id: 402, type: 'quantumTorpedo' }, deckSize: 12, maxDeckSize: 12 },
            { role: 'engineer', card: { id: 403, type: 'trickleCharge' }, deckSize: 8, maxDeckSize: 12 },
        ],
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ScienceChooses: Story = {};
