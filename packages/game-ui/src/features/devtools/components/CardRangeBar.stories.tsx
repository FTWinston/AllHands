import { fn } from 'storybook/test';
import { CardRangeBar as Component } from './CardRangeBar';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'game-ui/Dev Tools/Card Range Bar',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        send: fn(),
        info: {
            cards: [
                { type: 'slowAndSteady', system: 'helm', preset: 'targets', status: 'pass' },
                { type: 'phaserCannon', system: 'tactical', preset: 'targets', status: 'fail', note: 'Fires twice' },
                { type: 'phaserStrip', system: 'tactical', preset: 'targets' },
                { type: 'flare', system: 'tactical', preset: 'incoming', status: 'skip' },
            ],
            currentIndex: 1,
            active: true,
            progressFile: 'C:/all-hands/docs/card-range.json',
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Failed: Story = {};

export const Untested: Story = {
    args: {
        info: {
            ...meta.args!.info!,
            currentIndex: 2,
        },
    },
};
