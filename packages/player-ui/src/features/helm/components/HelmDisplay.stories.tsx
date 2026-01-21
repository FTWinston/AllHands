import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { Keyframes } from 'common-data/features/space/types/Keyframes';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { MinimalReadonlyArray } from 'common-data/types/MinimalArray';
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
        const { cards, expendCard, cardGeneration } = useFakePowerAndCards({
            ...args,
            cards: args.cards || [] as MinimalReadonlyArray<CardInstance>,
            createCard: (id: number) => ({
                id,
                type: 'slowAndSteady',
            }),
        });

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
                cardGeneration={cardGeneration}
                maxHandSize={args.maxHandSize}
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
                type: 'exampleNoTarget',
            },
            {
                id: 2,
                type: 'slowAndSteady',
            },
            {
                id: 3,
                type: 'slowAndSteady',
            },
        ],
        objects: {},
        power: 5,
        maxHandSize: 5,
        timeProvider: { getServerTime: () => Date.now() },
    },
};
