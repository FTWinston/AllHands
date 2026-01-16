import { Button } from 'common-ui/components/Button';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { CardDropTarget } from './CardDropTarget';
import { CardHand } from './CardHand';
import { DragCardProvider } from './DragCardProvider';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof CardHand> = {
    title: 'player-ui/Card Hand',
    component: CardHand,
    parameters: {
        layout: 'fullscreen',
    },
    render: (args) => {
        const [cards, setCards] = useState(args.cards);
        const [nextId, setNextId] = useState(10);

        const handleCardDropped = (cardId: number, targetId: string | null) => {
            console.log(`dropped card ${cardId} on target ${targetId}`);
            setCards(cards => cards.filter(card => card.id !== cardId));
            fn();
        };

        return (
            <DragCardProvider onCardDropped={handleCardDropped}>
                <div style={{ height: '100dvh', display: 'flex' }}>
                    <CardHand {...args} cards={cards} />

                    <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', maxWidth: 'calc(100vw - 20em)', flexWrap: 'wrap', gap: '3em' }}>
                        <CardDropTarget
                            id="location-drop"
                            targetType="location"
                        >
                            Location drop
                        </CardDropTarget>
                        <CardDropTarget
                            id="enemy-drop"
                            targetType="enemy"
                        >
                            Enemy drop
                        </CardDropTarget>
                        <CardDropTarget
                            id="system-drop"
                            targetType="system"
                        >
                            System drop
                        </CardDropTarget>
                        <CardDropTarget
                            id="weapon-slot-drop"
                            targetType="weapon-slot"
                        >
                            Weapon slot drop
                        </CardDropTarget>
                        <CardDropTarget
                            id="weapon-drop"
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
                                    type: 'slowAndSteady',
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
            </DragCardProvider>
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
                type: 'slowAndSteady',
            },
            {
                id: 2,
                type: 'exampleWeaponSlotTarget',
            },
            {
                id: 3,
                type: 'exampleEnemyTarget',
            },
        ],
    },
};

export const Five: Story = {
    args: {
        cards: [
            {
                id: 1,
                type: 'exampleSystemTarget',
            },
            {
                id: 2,
                type: 'exampleNoTarget',
            },
            {
                id: 3,
                type: 'exampleWeaponSlotTarget',
            },
            {
                id: 4,
                type: 'slowAndSteady',
            },
            {
                id: 5,
                type: 'exampleWeaponTarget',
            },
        ],
    },
};

export const Nine: Story = {
    args: {
        cards: [
            {
                id: 1,
                type: 'exampleSystemTarget',
            },
            {
                id: 2,
                type: 'exampleNoTarget',
            },
            {
                id: 3,
                type: 'exampleWeaponSlotTarget',
            },
            {
                id: 4,
                type: 'slowAndSteady',
            },
            {
                id: 5,
                type: 'exampleWeaponTarget',
            },
            {
                id: 6,
                type: 'exampleEnemyTarget',
            },
            {
                id: 7,
                type: 'exampleNoTarget',
            },
            {
                id: 8,
                type: 'exampleWeaponSlotTarget',
            },
            {
                id: 9,
                type: 'slowAndSteady',
            },
        ],
    },
};
