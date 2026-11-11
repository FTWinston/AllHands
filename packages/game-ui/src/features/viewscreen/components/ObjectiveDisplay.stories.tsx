import { Screen } from 'common-ui/components/Screen';
import { ObjectiveDisplay as Component } from './ObjectiveDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'game-ui/Objective Display',
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
        objective: { type: 'clear' },
        outcome: null,
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Clear: Story = {};

export const Survive: Story = {
    args: { objective: { type: 'survive', durationMs: 75_000 } },
};

export const Protect: Story = {
    args: { objective: { type: 'protect', subject: 'Marrow' } },
};

export const Disable: Story = {
    args: { objective: { type: 'disable', subject: 'Customs Platform 7' } },
};

export const Complete: Story = {
    args: { outcome: 'success' },
};

export const Failed: Story = {
    args: { objective: { type: 'protect', subject: 'Marrow' }, outcome: 'failure' },
};
