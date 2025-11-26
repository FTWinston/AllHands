import { Vector2D } from 'common-types';
import { useEffect, useState } from 'react';
import { fn } from 'storybook/test';
import { useFakePowerAndCards } from '../../engineer/components/EngineerDisplay.stories';
import { HelmDisplay as Component } from './HelmDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Helm/UI',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        onPause: fn(),
    },
    render: (args) => {
        const { power, cards, expendCard, handSize, powerGeneration, cardGeneration, priority, setPriority } = useFakePowerAndCards({
            ...args,
            cards: args.cards || [],
            createCard: (id: number) => ({
                id,
                type: 'exampleLocationTarget',
            }),
        });

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
            <Component
                {...args}
                priority={priority}
                setPriority={setPriority}
                powerGeneration={powerGeneration}
                cardGeneration={cardGeneration}
                handSize={handSize}
                maxHandSize={args.maxHandSize}
                power={power}
                cards={cards}
                center={center}
                playCard={(cardId, targetType, targetId) => {
                    console.log(`dropped card ${cardId} on ${targetType} ${targetId}`);
                    expendCard(cardId);
                }}
            />
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const UI: Story = {
    args: {
        cards: [
            {
                id: 1,
                type: 'exampleLocationTarget',
            },
            {
                id: 2,
                type: 'exampleLocationTarget',
            },
            {
                id: 3,
                type: 'exampleLocationTarget',
            },
        ],
        power: 2,
        maxPower: 5,
        handSize: 3,
        maxHandSize: 5,
        center: { x: 0, y: 0 },
    },
};
