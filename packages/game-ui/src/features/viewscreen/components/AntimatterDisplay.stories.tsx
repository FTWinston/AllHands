import { Screen } from 'common-ui/components/Screen';
import { AntimatterDisplay as Component } from './AntimatterDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'game-ui/Antimatter Display',
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

export const None: Story = {
    args: { antimatter: 0 },
};

export const Some: Story = {
    args: { antimatter: 140 },
};
