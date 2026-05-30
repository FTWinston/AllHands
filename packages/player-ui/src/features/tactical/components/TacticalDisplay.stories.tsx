import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { TimeProviderContext } from 'common-ui/contexts/TimeProviderContext';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { useFakePowerAndCards } from '../../engineer/components/EngineerDisplay.stories';
import { TacticalDisplay as Component } from './TacticalDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const timeProvider = { getServerTime: () => Date.now() };

const meta: Meta<typeof Component> = {
    title: 'player-ui/Tactical/UI',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    decorators: [
        Story => (
            <TimeProviderContext.Provider value={timeProvider}>
                <Story />
            </TimeProviderContext.Provider>
        ),
    ],
    args: {
        onPause: fn(),
    },
    render: (args) => {
        const { cards, expendCard, cardGeneration } = useFakePowerAndCards({
            ...args,
            cards: args.cards || [],
            createCard: (id: number) => {
                switch (Math.floor(Math.random() * 3)) {
                    case 0:
                        return {
                            id,
                            type: 'phaserStrip',
                        };
                    case 1:
                        return {
                            id,
                            type: 'quickCharge',
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
                cardGeneration={cardGeneration}
                maxHandSize={args.maxHandSize}
                cards={cards}
                playCard={(cardId, _cardType, targetType, targetId) => {
                    console.log(`dropped card ${cardId} on ${targetType} ${targetId}`);
                    expendCard(cardId);

                    if (targetType === 'weapon-slot') {
                        const card = cards.find(c => c.id === cardId) || null;
                        if (card) {
                            setSlots(prevSlots => prevSlots.map(slot => slot.id === targetId ? { ...slot, weapon: {
                                primed: false,
                                card,
                                charge: 0,
                            } } : slot));
                        }
                    } else if (targetType === 'weapon') {
                        const card = cards.find(c => c.id === cardId);
                        const cardCost = card ? getCardDefinition(card.type).parameters.cost : 0;

                        if (cardCost) {
                            setSlots(prevSlots => prevSlots.map(slot => slot.id === targetId ? {
                                ...slot,
                                charge: slot.charge + cardCost,
                                primed: slot.primed,
                            } : slot));
                        }
                    }
                }}
                slots={slots}
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
                type: 'phaserStrip',
            },
            {
                id: 2,
                type: 'quickCharge',
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
                id: 'slot1',
                card: null,
                charge: 0,
                primed: false,
            },
            {
                id: 'slot2',
                primed: false,
                charge: 0,
                card: {
                    id: 5,
                    type: 'phaserStrip',
                },
                decay: {
                    startTime: Date.now(),
                    endTime: Date.now() + 10000,
                },
            },
        ],
        targets: [
            {
                id: 'target1',
                name: 'Enemy Ship 1',
                appearance: 'scout',
                relationship: RelationshipType.Hostile,
                motion: [
                    { time: 0, x: 100, y: 100, angle: 0 },
                    { time: 1000, x: 200, y: 100, angle: 0 },
                ],
            },
            {
                id: 'target2',
                name: 'Enemy Ship 2',
                appearance: 'starfighter',
                relationship: RelationshipType.Hostile,
                motion: [
                    { time: 0, x: -100, y: 100, angle: 0 },
                    { time: 1000, x: 100, y: -100, angle: 0 },
                ],
            },
            {
                id: 'target3',
                name: 'Enemy Ship 3',
                appearance: 'satellite',
                relationship: RelationshipType.Hostile,
                motion: [
                    { time: 0, x: 100, y: 100, angle: 0 },
                    { time: 1000, x: 200, y: 100, angle: 0 },
                ],
            },
            {
                id: 'target4',
                name: 'Enemy Ship 4',
                appearance: 'interceptor',
                relationship: RelationshipType.Hostile,
                motion: [
                    { time: 0, x: -100, y: 100, angle: 0 },
                    { time: 1000, x: 100, y: -100, angle: 0 },
                ],
            },
            {
                id: 'target5',
                name: 'Enemy Ship 5',
                appearance: 'spaceship',
                relationship: RelationshipType.Hostile,
                motion: [
                    { time: 0, x: -100, y: 100, angle: 0 },
                    { time: 1000, x: 100, y: -100, angle: 0 },
                ],
            },
        ],
        vulnerabilitiesByTarget: {
            target2: { vulnerabilities: [] },
            target3: { vulnerabilities: [{ type: 'engine', aspect: Math.PI }] },
            target4: { vulnerabilities: [{ type: 'shields', aspect: 0 }, { type: 'weapons', aspect: Math.PI }] },
            target5: { vulnerabilities: [{ type: 'shields', aspect: 0 }, { type: 'weapons', aspect: -Math.PI / 2 }, { type: 'engine', aspect: Math.PI }] },
        },
        power: 5,
        maxHandSize: 5,
        drawPileSize: 3,
        shipMotion: [
            { time: 0, x: 0, y: 0, angle: 0 },
            { time: 1000, x: 0, y: 0, angle: 0 },
        ],
    },
};
