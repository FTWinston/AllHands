import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { fn } from 'storybook/test';
import { useFakePowerAndCards, useFakePowerAndGeneration } from '../../engineer/components/EngineerDisplay.stories';
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
        const { power, cards, expendCard, handSize, powerGeneration, cardGeneration, priority, setPriority } = useFakePowerAndCards({
            ...args,
            cards: args.cards || [],
            createCard: (id: number) => ({
                id,
                crew: 'sensors',
                targetType: 'no-target',
                name: 'Some Card',
                description: 'A card that has a particular effect, for a particular crew role. Extra line!',
                descriptionLineHeight: 1.25,
                image: <ExampleIcon />,
                cost: 1,
            }),
        });

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
                crew: 'sensors',
                targetType: 'no-target',
                name: 'Some Card',
                description: 'A card that has a particular effect, for a particular crew role. Extra line!',
                descriptionLineHeight: 1.25,
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 2,
                crew: 'sensors',
                targetType: 'enemy',
                name: 'Some Card with a longer title',
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 3,
                crew: 'sensors',
                targetType: 'enemy',
                name: 'Some Card with a title that\'s really quite long',
                nameFontSize: 0.88,
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
        ],
        power: 2,
        maxPower: 5,
        handSize: 3,
        maxHandSize: 5,
    },
};
