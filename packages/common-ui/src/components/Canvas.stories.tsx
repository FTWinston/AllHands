import { useRef } from 'react';
import { Canvas as Component } from './Canvas';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
    title: 'common-ui/components/Canvas',
    component: Component,
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Canvas: Story = {
    args: {
        draw: (ctx: CanvasRenderingContext2D, viewBounds: DOMRect) => {
            ctx.fillStyle = 'purple';
            ctx.fillRect(viewBounds.x, viewBounds.y, viewBounds.width * 0.5, viewBounds.height * 0.5);
            ctx.fillRect(
                viewBounds.x + viewBounds.width * 0.5,
                viewBounds.y + viewBounds.height * 0.5,
                viewBounds.width * 0.5,
                viewBounds.height * 0.5
            );
        },
        style: {
            width: 'calc(100vw - 2rem)',
            height: 'calc(100vh - 2rem)',
        },
    },

    render: (args) => {
        const canvas = useRef<HTMLCanvasElement>(null);
        return <Component {...args} ref={canvas} />;
    },
};
