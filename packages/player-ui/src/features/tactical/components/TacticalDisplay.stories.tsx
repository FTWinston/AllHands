import { getCardDefinition } from 'common-ui/getCardDefinition';
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
            createCard: (id: number) => {
                switch (Math.floor(Math.random() * 3)) {
                    case 0:
                        return {
                            id,
                            type: 'exampleWeaponSlotTarget',
                        };
                    case 1:
                        return {
                            id,
                            type: 'exampleWeaponTarget',
                        };
                    default:
                        return {
                            id,
                            type: 'exampleEnemyTarget',
                        };
                }
            },
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
                    } else if (targetType === 'weapon') {
                        const card = cards.find(c => c.id === cardId);
                        const cardCost = card ? getCardDefinition(card.type).cost : 0;

                        if (cardCost) {
                            setSlots(prevSlots => prevSlots.map(slot => slot.name === targetId ? {
                                ...slot,
                                costToReactivate: slot.costToReactivate ? Math.max(0, slot.costToReactivate - cardCost) : slot.costToReactivate,
                            } : slot));
                        }
                    }
                }}
                slots={slots}
                slotFired={(slotIndex) => {
                    console.log(`fired slot ${slotIndex}`);
                    setSlots(prevSlots => prevSlots.map((slot, index) => index === slotIndex && slot.card ? { ...slot, costToReactivate: getCardDefinition(slot.card.type).cost } : slot));
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
                type: 'exampleWeaponSlotTarget',
            },
            {
                id: 2,
                type: 'exampleWeaponTarget',
            },
            {
                id: 3,
                type: 'exampleEnemyTarget',
            },
            {
                id: 4,
                type: 'exampleEnemyTarget',
            },
        ],
        slots: [
            {
                name: 'Weapon slot 1',
                card: null,
            },
            {
                name: 'Weapon slot 2',
                costToReactivate: 2,
                card: {
                    id: 5,
                    type: 'exampleWeaponSlotTarget',
                },
            },
        ],
        targets: [
            {
                id: 'Enemy Ship 1',
                appearance: 'scout',
                slotNoFireReasons: ['range', 'bearing'],
            },
            {
                id: 'Enemy Ship 2',
                appearance: 'starfighter',
                slotNoFireReasons: [null, 'range'],
            },
            {
                id: 'Enemy Ship 3',
                appearance: 'satellite',
                slotNoFireReasons: [null, null],
                vulnerabilities: ['engine'],
            },
            {
                id: 'Enemy Ship 4',
                appearance: 'interceptor',
                slotNoFireReasons: [null, null],
                vulnerabilities: ['shields', 'weapons'],
            },
            {
                id: 'Enemy Ship 5',
                appearance: 'spaceship',
                slotNoFireReasons: [null, null],
                vulnerabilities: ['shields', 'weapons', 'engine'],
            },
        ],
        power: 2,
        maxPower: 5,
        handSize: 4,
        maxHandSize: 5,
    },
};
