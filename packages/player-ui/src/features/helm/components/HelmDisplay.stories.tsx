import { useLoopingKeyframes } from 'common-ui/hooks/useLoopingKeyframes';
import { useState } from 'react';
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

        const [center, setCenter] = useState(() => ([
            { time: Date.now(), val: { x: 0, y: 0 } },
            { time: Date.now() + 5000, val: { x: 5, y: 0 } },
            { time: Date.now() + 10000, val: { x: 5, y: 5 } },
            { time: Date.now() + 15000, val: { x: 0, y: 5 } },
        ]));

        useLoopingKeyframes(setCenter, args.timeProvider, 20000);

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
        mapItems: [],
        power: 2,
        maxPower: 5,
        handSize: 3,
        maxHandSize: 5,
        timeProvider: { getServerTime: () => Date.now() },
    },
};
