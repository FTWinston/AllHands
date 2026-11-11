import { Screen } from 'common-ui/components/Screen';
import { HailDisplay as Component } from './HailDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'game-ui/Hail Display',
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

export const ShortLine: Story = {
    args: {
        hail: { speaker: 'Warden Cruiser Assize', text: 'Cost exceeds mandate. Withdrawing.' },
    },
};

/** About as much as anyone says at once: a briefing that states the whole rule of an encounter. */
export const LongLine: Story = {
    args: {
        hail: {
            speaker: 'Dock Clerk, Tessaly Yard',
            text: 'Manual says it stands down for an inspection signal: three parts, off your deflector. It only listens with its shields down, and it answers in kind, so match how it shoots. Please don\'t break it. We need the dock.',
        },
    },
};

export const NobodySpeaking: Story = {
    args: {
        hail: null,
    },
};
