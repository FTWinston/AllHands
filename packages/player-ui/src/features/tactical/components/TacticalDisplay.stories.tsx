import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { useFakePowerAndCards } from '../../engineer/components/EngineerDisplay.stories';
import { TacticalDisplay as Component } from './TacticalDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Tactical/UI',
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
                crew: 'tactical',
                targetType: 'no-target',
                name: 'Some Card',
                description: 'A card that has a particular effect, for a particular crew role. Extra line!',
                descriptionLineHeight: 1.25,
                image: <ExampleIcon />,
                cost: 1,
            }),
        });

        const [slots, setSlots] = useState(args.slots || []);

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

                    if (targetType === 'weapon-slot') {
                        const card = cards.find(c => c.id === cardId) || null;
                        setSlots(prevSlots => prevSlots.map(slot => slot.name === targetId ? { ...slot, card } : slot));
                    }
                }}
                slots={slots}
                slotFired={(slotIndex) => {
                    console.log(`fired slot ${slotIndex}`);
                    setSlots(prevSlots => prevSlots.map((slot, index) => index === slotIndex ? { ...slot, costToReactivate: 2 } : slot));
                }}
                slotDeactivated={(slotIndex) => {
                    console.log(`deactivated slot ${slotIndex}`);
                    setSlots(prevSlots => prevSlots.map((slot, index) => index === slotIndex ? { ...slot, card: null, costToReactivate: undefined } : slot));
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
                targetType: 'weapon-slot',
                name: 'Some Card with a longer title',
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 3,
                crew: 'tactical',
                targetType: 'weapon',
                name: 'Some Card with a title that\'s really quite long',
                nameFontSize: 0.88,
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 4,
                crew: 'tactical',
                targetType: 'enemy',
                name: 'Yet another card',
                nameFontSize: 0.88,
                description: 'This one targets an enemy, I guess.',
                image: <ExampleIcon />,
                cost: 3,
            },
        ],
        slots: [
            {
                name: 'Weapon slot 1',
                card: null,
            },
            {
                name: 'Weapon slot 2',
                costToReactivate: 0,
                card: {
                    id: 5,
                    crew: 'tactical',
                    targetType: 'weapon-slot',
                    name: 'Some Card with a longer title',
                    description: 'A card that has a particular effect, for a particular crew role.',
                    image: <ExampleIcon />,
                    cost: 1,
                },
            },
        ],
        targets: [
            {
                id: 'Enemy Ship 1',
                appearance: 'scout',
            },
            {
                id: 'Enemy Ship 2',
                appearance: 'starfighter',
            },
            {
                id: 'Enemy Ship 3',
                appearance: 'satellite',
            },
            {
                id: 'Enemy Ship 4',
                appearance: 'interceptor',
            },
            {
                id: 'Enemy Ship 5',
                appearance: 'spaceship',
            },
        ],
        power: 2,
        maxPower: 5,
        handSize: 4,
        maxHandSize: 5,
    },
};
