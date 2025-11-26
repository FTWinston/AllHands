import { useState } from 'react';
import { useLoopingKeyframes } from 'src/hooks/useLoopingKeyframes';
import { SpaceCells as Component } from './SpaceCells';
import type { Meta, StoryObj } from '@storybook/react-vite';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'common-ui/features/spacemap/Space Cells',
    component: Component,
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Static: Story = {
    args: {
        fontSizeEm: 4,
        center: [{ time: 0, val: { x: 0, y: 0 } }],
        timeProvider: { getServerTime: () => Date.now() },
    },
    render: args => (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 2em)' }}>
            <Component {...args} />
        </div>
    ),
};

export const Moving: Story = {
    ...Static,
    render: (args) => {
        const [center, setCenter] = useState(() => ([
            { time: Date.now(), val: { x: 0, y: 0 } },
            { time: Date.now() + 5000, val: { x: 2, y: 0 } },
            { time: Date.now() + 10000, val: { x: 2, y: 2 } },
            { time: Date.now() + 15000, val: { x: 0, y: 2 } },
            { time: Date.now() + 20000, val: { x: 0, y: 0 } },
        ]));

        useLoopingKeyframes(setCenter, args.timeProvider, 20000);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 2em)' }}>
                <Component {...args} center={center} />
            </div>
        );
    },
};
