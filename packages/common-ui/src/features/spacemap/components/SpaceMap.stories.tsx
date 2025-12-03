import { GameObjectInfo, RelationshipType } from 'common-types';
import { useMemo, useRef, useState } from 'react';
import { useLoopingKeyframes } from 'src/hooks/useLoopingKeyframes';
import { getClosestCellCenter } from '../utils/drawHexGrid';
import { SpaceMap as Component } from './SpaceMap';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
    title: 'common-ui/features/spacemap/Space Map',
    component: Component,
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Static: Story = {
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

export const Moving: Story = {
    ...Static,
    render: (args) => {
        const [center, setCenter] = useState(() => ([
            { time: Date.now(), val: { x: 0, y: 0 } },
            { time: Date.now() + 5000, val: { x: 2, y: 0 } },
            { time: Date.now() + 10000, val: { x: 2, y: 2 } },
            { time: Date.now() + 15000, val: { x: 0, y: 2 } },
        ]));

        useLoopingKeyframes(setCenter, args.timeProvider, 20000);

        const [itemPos, setItemPos] = useState(() => ([
            { time: Date.now(), val: { ...getClosestCellCenter(0, 0), angle: 5 * Math.PI / 4 } }, // Down and left
            { time: Date.now() + 5000, val: { ...getClosestCellCenter(0, 2), angle: 7 * Math.PI / 4 } }, // Down and right
            { time: Date.now() + 10000, val: { ...getClosestCellCenter(3, 2), angle: 1 * Math.PI / 4 } }, // Up and right
            { time: Date.now() + 15000, val: { ...getClosestCellCenter(3, 0), angle: 3 * Math.PI / 4 } }, // Up and left
        ]));

        useLoopingKeyframes(setItemPos, args.timeProvider, 20000);

        const objects: GameObjectInfo[] = useMemo(() => [
            {
                id: 1,
                draw: 'chevron',
                relationship: RelationshipType.Self,
                motion: itemPos,
            },
        ], [itemPos]);

        const canvas = useRef<HTMLCanvasElement>(null);

        return (
            <Component
                {...args}
                center={center}
                objects={objects}
                ref={canvas}
            />
        );
    },
};
