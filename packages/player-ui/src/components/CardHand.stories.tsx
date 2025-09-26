import { fn } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardHandDisplay } from './CardHandDisplay';

import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { useState } from 'react';
import { Button } from 'common-ui/Button';

const meta: Meta<typeof CardHandDisplay> = {
    title: 'player-ui/Card Hand',
    component: CardHandDisplay,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Display component for the player lobby where crew members choose their roles and indicate readiness.',
            },
        },
    },
    args: {
        onPlay: fn(),
    },
    render: (args) => {
        const [cards, setCards] = useState(args.cards);
        const [nextId, setNextId] = useState(10);

        return (
            <div style={{ height: '100vh', display: 'flex' }}>
                <CardHandDisplay {...args} cards={cards} />

                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: '1em' }}>
                    <Button
                        label='Add card'
                        onClick={() => {
                            setCards(cards => [...cards, {
                                id: nextId,
                                crew: 'helm',
                                name: 'New Card',
                                description: 'A new card description.',
                                image: <ExampleIcon />,
                                cost: 1,
                            }]);
                            setNextId(id => id + 1);
                        }}
                    />

                    <Button
                        label='Remove card'
                            onClick={() => setCards(cards => {
                                if (cards.length === 0) {
                                    return cards;
                                }
                                const idx = Math.floor(Math.random() * cards.length);
                                return cards.filter((_, i) => i !== idx);
                            })}
                    />   
                </div>
            </div>
        )
    }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
    args: {
        cards: []
    },
};

export const Three: Story = {
    args: {
        cards: [
            {
                id: 1,
                crew: 'helm',
                name: 'Some Card',
                description: 'A card that has a particular effect, for a particular crew role. Extra line!',
                descriptionLineHeight: 1.25,
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 2,
                crew: 'tactical',
                name: 'Some Card with a longer title',
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 3,
                crew: 'sensors',
                name: 'Some Card with a title that\'s really quite long',
                nameFontSize: 0.88,
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
        ]
    },
};


export const Five: Story = {
    args: {
        cards: [
            {
                id: 1,
                crew: 'helm',
                name: 'Some Card',
                description: 'A card that has a particular effect, for a particular crew role. Extra line!',
                descriptionLineHeight: 1.25,
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 2,
                crew: 'tactical',
                name: 'Some Card with a longer title',
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 3,
                crew: 'sensors',
                name: 'Some Card with a title that\'s really quite long',
                nameFontSize: 0.88,
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 4,
                crew: 'helm',
                name: 'Some Card',
                description: 'A card that has a particular effect, for a particular crew role. Extra line!',
                descriptionLineHeight: 1.25,
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 5,
                crew: 'tactical',
                name: 'Some Card with a longer title',
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
        ]
    },
};

export const Nine: Story = {
    args: {
        cards: [
            {
                id: 1,
                crew: 'helm',
                name: 'Some Card',
                description: 'A card that has a particular effect, for a particular crew role. Extra line!',
                descriptionLineHeight: 1.25,
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 2,
                crew: 'tactical',
                name: 'Some Card with a longer title',
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 3,
                crew: 'sensors',
                name: 'Some Card with a title that\'s really quite long',
                nameFontSize: 0.88,
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 4,
                crew: 'helm',
                name: 'Some Card',
                description: 'A card that has a particular effect, for a particular crew role. Extra line!',
                descriptionLineHeight: 1.25,
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 5,
                crew: 'tactical',
                name: 'Some Card with a longer title',
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 6,
                crew: 'helm',
                name: 'Some Card',
                description: 'A card that has a particular effect, for a particular crew role. Extra line!',
                descriptionLineHeight: 1.25,
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 7,
                crew: 'tactical',
                name: 'Some Card with a longer title',
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 8,
                crew: 'sensors',
                name: 'Some Card with a title that\'s really quite long',
                nameFontSize: 0.88,
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 9,
                crew: 'helm',
                name: 'Some Card',
                description: 'A card that has a particular effect, for a particular crew role. Extra line!',
                descriptionLineHeight: 1.25,
                image: <ExampleIcon />,
                cost: 1,
            },
        ]
    },
};
