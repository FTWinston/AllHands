import { RelationshipType } from 'common-types';
import { useRef } from 'react';
import { SpaceMap as Component } from './SpaceMap';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
    title: 'common-ui/features/spacemap/Space Map',
    component: Component,
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SpaceMap: Story = {
    args: {
        center: [{ time: 0, val: { x: 0, y: 0 } }],
        timeProvider: { getServerTime: () => Date.now() },
        cellRadius: 32,
        gridColor: 'green',
        objects: [
            {
                id: 1,
                draw: 'chevron',
                relationship: RelationshipType.Self,
                motion: [
                    {
                        time: Date.now(),
                        val: {
                            x: 0,
                            y: 0,
                            angle: 0,
                        },
                    },
                    {
                        time: Date.now() + 3000,
                        val: {
                            x: 5,
                            y: 0,
                            angle: Math.PI,
                        },
                    },
                ],
            },
        ],
        style: { width: 'calc(100vw - 2em)', height: 'calc(100vh - 2em)' },
    },
    render: (args) => {
        const canvas = useRef<HTMLCanvasElement>(null);

        return (
            <Component
                {...args}
                ref={canvas}
            />
        );
    },
};
