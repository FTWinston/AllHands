import { useEffect, useState } from 'react';
import { SpaceCells as Component } from './SpaceCells';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Vector2D } from 'common-types';

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
        center: { x: 0, y: 0 },
    },
    render: args => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <Component {...args} />
        </div>
    ),
};

export const Moving: Story = {
    ...Static,
    render: (args) => {
        const [center, setCenter] = useState<Vector2D>(args.center);

        useEffect(() => {
            const radius = 3;
            const angularSpeed = 0.5; // radians per second
            let animationFrameId: number;
            let lastTime: number | null = null;
            let angle = 0;

            const animate = (currentTime: number) => {
                if (lastTime !== null) {
                    const deltaTime = (currentTime - lastTime) / 1000; // convert to seconds
                    angle += angularSpeed * deltaTime;
                }
                lastTime = currentTime;

                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                setCenter({ x, y });
                animationFrameId = requestAnimationFrame(animate);
            };

            animationFrameId = requestAnimationFrame(animate);
            return () => cancelAnimationFrame(animationFrameId);
        }, []);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <Component {...args} center={center} />
            </div>
        );
    },
};
