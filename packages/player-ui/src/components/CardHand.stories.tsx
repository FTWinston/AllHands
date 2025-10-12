import { Button } from 'common-ui/Button';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { ActiveCardProvider } from './ActiveCardProvider';
import { CardDropTarget } from './CardDropTarget';
import { CardHand } from './CardHand';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof CardHand> = {
    title: 'player-ui/Card Hand',
    component: CardHand,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Display component for the player lobby where crew members choose their roles and indicate readiness.',
            },
        },
    },
    render: (args) => {
        const [cards, setCards] = useState(args.cards);
        const [nextId, setNextId] = useState(10);

        return (
            <ActiveCardProvider>
                <div style={{ height: '100dvh', display: 'flex' }}>
                    <CardHand {...args} cards={cards} />

                    <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', maxWidth: 'calc(100vw - 20em)', flexWrap: 'wrap', gap: '3em' }}>
                        <CardDropTarget
                            onCardDropped={(cardId) => {
                                console.log(`dropped card ${cardId} on no target`);
                                setCards(cards => cards.filter(card => card.id !== cardId));
                                fn();
                            }}
                            targetType="no-target"
                        >
                            No target drop
                        </CardDropTarget>
                        <CardDropTarget
                            onCardDropped={(cardId) => {
                                console.log(`dropped card ${cardId} on location target`);
                                setCards(cards => cards.filter(card => card.id !== cardId));
                                fn();
                            }}
                            targetType="location"
                        >
                            Location drop
                        </CardDropTarget>
                        <CardDropTarget
                            onCardDropped={(cardId) => {
                                console.log(`dropped card ${cardId} on enemy target`);
                                setCards(cards => cards.filter(card => card.id !== cardId));
                                fn();
                            }}
                            targetType="enemy"
                        >
                            Enemy drop
                        </CardDropTarget>
                        <CardDropTarget
                            onCardDropped={(cardId) => {
                                console.log(`dropped card ${cardId} on system target`);
                                setCards(cards => cards.filter(card => card.id !== cardId));
                                fn();
                            }}
                            targetType="system"
                        >
                            System drop
                        </CardDropTarget>
                        <CardDropTarget
                            onCardDropped={(cardId) => {
                                console.log(`dropped card ${cardId} on weapon slot target`);
                                setCards(cards => cards.filter(card => card.id !== cardId));
                                fn();
                            }}
                            targetType="weapon-slot"
                        >
                            Weapon slot drop
                        </CardDropTarget>
                        <CardDropTarget
                            onCardDropped={(cardId) => {
                                console.log(`dropped card ${cardId} on weapon target`);
                                setCards(cards => cards.filter(card => card.id !== cardId));
                                fn();
                            }}
                            targetType="weapon"
                        >
                            Weapon drop
                        </CardDropTarget>
                    </div>

                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: '1em' }}>
                        <Button
                            onClick={() => {
                                setCards(cards => [...cards, {
                                    id: nextId,
                                    crew: 'helm',
                                    targetType: 'no-target',
                                    name: 'New Card',
                                    description: 'A new card description.',
                                    image: <ExampleIcon />,
                                    cost: 1,
                                }]);
                                setNextId(id => id + 1);
                            }}
                        >
                            Add card
                        </Button>

                        <Button
                            onClick={() => setCards((cards) => {
                                if (cards.length === 0) {
                                    return cards;
                                }
                                const idx = Math.floor(Math.random() * cards.length);
                                return cards.filter((_, i) => i !== idx);
                            })}
                        >
                            Remove card
                        </Button>
                    </div>
                </div>
            </ActiveCardProvider>
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
    args: {
        cards: [],
    },
};

export const Three: Story = {
    args: {
        cards: [
            {
                id: 1,
                crew: 'helm',
                targetType: 'location',
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
                crew: 'sensors',
                targetType: 'enemy',
                name: 'Some Card with a title that\'s really quite long',
                nameFontSize: 0.88,
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
        ],
    },
};

export const Five: Story = {
    args: {
        cards: [
            {
                id: 1,
                crew: 'helm',
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
                targetType: 'weapon',
                name: 'Some Card with a longer title',
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 3,
                crew: 'sensors',
                targetType: 'weapon-slot',
                name: 'Some Card with a title that\'s really quite long',
                nameFontSize: 0.88,
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 4,
                crew: 'helm',
                targetType: 'system',
                name: 'Some Card',
                description: 'A card that has a particular effect, for a particular crew role. Extra line!',
                descriptionLineHeight: 1.25,
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 5,
                crew: 'tactical',
                targetType: 'enemy',
                name: 'Some Card with a longer title',
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
        ],
    },
};

export const Nine: Story = {
    args: {
        cards: [
            {
                id: 1,
                crew: 'helm',
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
                crew: 'sensors',
                targetType: 'enemy',
                name: 'Some Card with a title that\'s really quite long',
                nameFontSize: 0.88,
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 4,
                crew: 'helm',
                targetType: 'no-target',
                name: 'Some Card',
                description: 'A card that has a particular effect, for a particular crew role. Extra line!',
                descriptionLineHeight: 1.25,
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 5,
                crew: 'tactical',
                targetType: 'enemy',
                name: 'Some Card with a longer title',
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 6,
                crew: 'helm',
                targetType: 'location',
                name: 'Some Card',
                description: 'A card that has a particular effect, for a particular crew role. Extra line!',
                descriptionLineHeight: 1.25,
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 7,
                crew: 'tactical',
                targetType: 'weapon',
                name: 'Some Card with a longer title',
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 8,
                crew: 'sensors',
                targetType: 'no-target',
                name: 'Some Card with a title that\'s really quite long',
                nameFontSize: 0.88,
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 9,
                crew: 'helm',
                targetType: 'location',
                name: 'Some Card',
                description: 'A card that has a particular effect, for a particular crew role. Extra line!',
                descriptionLineHeight: 1.25,
                image: <ExampleIcon />,
                cost: 1,
            },
        ],
    },
};
