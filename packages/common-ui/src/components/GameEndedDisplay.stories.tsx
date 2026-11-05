import { GameEndedDisplay as Component } from './GameEndedDisplay';
import { Screen } from './Screen';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'common-ui/components/Game Ended Display',
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

export const Victory: Story = {
    args: { outcome: 'victory' },
};

export const Defeat: Story = {
    args: { outcome: 'defeat', message: { kind: 'defeat', title: 'Placeholder Sector 1', text: 'Placeholder defeat message for sector 1.' } },
};
