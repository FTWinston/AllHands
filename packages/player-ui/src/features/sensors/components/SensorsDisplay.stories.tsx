import { fn } from 'storybook/test';
import { useFakePowerAndCards } from '../../engineer/components/EngineerDisplay.stories';
import { SensorsDisplay as Component } from './SensorsDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Sensors/UI',
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
            cards: args.cards || [],
            createCard: (id: number) => ({
                id,
                type: 'exampleNoTarget',
            }),
        });

        return (
            <Component
                {...args}
                cardGeneration={cardGeneration}
                maxHandSize={args.maxHandSize}
                cards={cards}
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
                type: 'exampleNoTarget',
            },
            {
                id: 3,
                type: 'exampleNoTarget',
            },
        ],
        power: 5,
        maxHandSize: 5,
    },
};
