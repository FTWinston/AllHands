import { Keyframes } from 'common-data/features/space/types/Keyframes';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { useLoopingKeyframes } from 'common-ui/hooks/useLoopingKeyframes';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { GameDisplay as Component } from './GameDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'game-ui/Game Display',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        timeProvider: { getServerTime: () => Date.now() },
        showMenu: fn(),
    },
    render: (args) => {
        const [center, setCenter] = useState<Keyframes<Vector2D>>(() => ([
            { time: Date.now(), x: 0, y: 0 },
            { time: Date.now() + 5000, x: 5, y: 0 },
            { time: Date.now() + 10000, x: 5, y: 5 },
            { time: Date.now() + 15000, x: 0, y: 5 },
        ]));

        useLoopingKeyframes<Vector2D>(setCenter, args.timeProvider, 20000);

        return (
            <Component
                {...args}
                center={center}
            />
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const UI: Story = {
    args: {
        objects: [],
    },
};
