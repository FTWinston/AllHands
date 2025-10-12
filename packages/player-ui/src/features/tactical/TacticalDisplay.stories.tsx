import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { fn } from 'storybook/test';
import { useFakePowerAndGeneration } from '../engineer/EngineerDisplay.stories';
import { TacticalDisplay as Component } from './TacticalDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Tactical',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        onPause: fn(),
    },
    render: (args) => {
        const { power, handSize, powerGeneration, cardGeneration, priority, setPriority } = useFakePowerAndGeneration(args);

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
            />
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Tactical: Story = {
    args: {
        cards: [
            {
                id: 1,
                crew: 'tactical',
                targetType: 'no-target',
                name: 'Some Card',
                description: 'A card that has a particular effect, for a particular crew role. Extra line!',
                descriptionLineHeight: 1.25,
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 2,
                crew: 'tactical',
                targetType: 'no-target',
                name: 'Some Card with a longer title',
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 3,
                crew: 'tactical',
                targetType: 'no-target',
                name: 'Some Card with a title that\'s really quite long',
                nameFontSize: 0.88,
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
        ],
        power: 2,
        maxPower: 5,
        handSize: 4,
        maxHandSize: 5,
    },
};
