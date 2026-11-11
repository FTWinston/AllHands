import { Screen } from 'common-ui/components/Screen';
import { CommsDisplay as Component } from './CommsDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { PromptInfo } from 'common-data/features/sectors/types/PromptInfo';

const meta: Meta<typeof Component> = {
    title: 'game-ui/Comms Display',
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

const offer: PromptInfo = {
    speaker: 'Stranded Lead',
    text: 'There\'s two hundred of us on a dead hauler, and that ship\'s carrying antibiotics. A third of the stores and we\'re gone. Your call.',
    options: [
        { id: 'handOver', label: 'Hand it over' },
        { id: 'refuse', label: 'Refuse' },
    ],
    countdown: { startTime: now, endTime: now + 20_000 },
};

export const ShortLine: Story = {
    args: {
        hail: { speaker: 'Warden Cruiser Assize', text: 'Cost exceeds mandate. Withdrawing.' },
        prompt: null,
    },
};

/** About as much as anyone says at once: a briefing that states the whole rule of an encounter. */
export const LongLine: Story = {
    args: {
        hail: {
            speaker: 'Dock Clerk, Tessaly Yard',
            text: 'Manual says it stands down for an inspection signal: three parts, off your deflector. It only listens with its shields down, and it answers in kind, so match how it shoots. Please don\'t break it. We need the dock.',
        },
        prompt: null,
    },
};

/** A question that tactical has to answer. */
export const Offer: Story = {
    args: {
        hail: null,
        prompt: offer,
    },
};

/** Someone else speaking while the question waits: it appears above, rather than being hidden. */
export const HailDuringOffer: Story = {
    args: {
        hail: { speaker: 'Clinic Ship Marrow', text: 'Don\'t you dare. We need every vial.' },
        prompt: offer,
    },
};

export const NobodySpeaking: Story = {
    args: {
        hail: null,
        prompt: null,
    },
};
