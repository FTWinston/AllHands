import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { Cooldown } from 'common-data/types/Cooldown';
import { MinimalReadonlyArray } from 'common-data/types/MinimalArray';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fn } from 'storybook/test';
import { default as ExampleIcon1 } from '../../header/assets/card-hand.svg?react';
import { default as ExampleIcon3 } from '../../header/assets/health.svg?react';
import { default as ExampleIcon2 } from '../../header/assets/power.svg?react';
import { EngineerDisplay as Component } from './EngineerDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Engineer/UI',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    includeStories: /^[A-Z]/,
    args: {
        onPause: fn(),
    },
    render: (args) => {
        const { cards, expendCard, cardGeneration } = useFakePowerAndCards({
            ...args,
            cards: args.cards || [],
            createCard: (id: number) => ({
                id,
                type: 'exampleSystemTarget',
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

type UseFakeCardGenerationArgs = {
    power: number;
    handSize: number;
    maxHandSize: number;
    generateCard?: () => void;
};

export const useFakeCardGeneration = (args: UseFakeCardGenerationArgs) => {
    const [handSize, setHandSize] = useState(args.handSize);
    const justChanged = useRef(false);
    const generateCard = args.generateCard;

    const { maxHandSize, power } = args;

    const [cardGeneration, setCardGeneration] = useState<Cooldown | undefined>(undefined);

    const shouldGenerateCard = handSize < maxHandSize;

    useEffect(() => {
        justChanged.current = true;

        const adjustGeneration = () => {
            if (shouldGenerateCard) {
                setCardGeneration({ startTime: Date.now(), endTime: Date.now() + 5000 });
                if (!justChanged.current) {
                    setHandSize(handSize => Math.min(handSize + 1, maxHandSize));
                    generateCard?.();
                }
            } else {
                setCardGeneration(undefined);
            }

            justChanged.current = false;
        };

        adjustGeneration();

        const interval = setInterval(adjustGeneration, 5000);

        return () => clearInterval(interval);
    }, [maxHandSize, shouldGenerateCard, generateCard]);

    const checkPowerAndRemoveCard = (powerCost: number) => {
        if (power >= powerCost) {
            setHandSize(handSize => Math.max(0, handSize - 1));
            return true;
        }

        return false;
    };

    return { checkPowerAndRemoveCard, handSize, cardGeneration };
};

type UseFakePowerAndCardsArgs = Omit<UseFakeCardGenerationArgs, 'handSize'> & {
    cards: MinimalReadonlyArray<CardInstance>;
    createCard: (id: number) => CardInstance;
};

export const useFakePowerAndCards = (args: UseFakePowerAndCardsArgs) => {
    const [cards, setCards] = useState(args.cards);

    const createCard = args.createCard;
    const nextCardId = useRef(10);

    const generateCard = useCallback(() => {
        setCards(cards => [
            ...cards,
            createCard(nextCardId.current++),
        ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fakeCardGenerationArgs = {
        ...args,
        generateCard,
    };

    const { checkPowerAndRemoveCard, ...cardGenerationResults } = useFakeCardGeneration({ ...fakeCardGenerationArgs, handSize: cards.length });

    const expendCard = useCallback((cardId: number) => {
        setCards((cards) => {
            const playedCard = cards.find(c => c.id === cardId);
            const cost = playedCard ? getCardDefinition(playedCard.type).cost : 0;
            if (playedCard && cost && checkPowerAndRemoveCard(cost)) {
                return cards.filter(card => card !== playedCard);
            }
            return cards;
        });
    }, [checkPowerAndRemoveCard]);

    return {
        ...cardGenerationResults,
        cards,
        expendCard,
    };
};

export const UI: Story = {
    args: {
        cards: [
            {
                id: 1,
                type: 'exampleSystemTarget',
            },
            {
                id: 2,
                type: 'exampleSystemTarget',
            },
            {
                id: 3,
                type: 'exampleSystemTarget',
            },
        ],
        systems: [
            {
                system: 'hull',
                health: 10,
                power: 5,
                effects: [
                    {
                        id: 'test1',
                        positive: true,
                        icon: ExampleIcon1,
                        name: 'Reinforced Plating',
                        description: <>Increases hull integrity by 2 for the next 30 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 30000 },
                    },
                    {
                        id: 'test3',
                        positive: false,
                        icon: ExampleIcon3,
                        name: 'Corrosion',
                        description: <>Increases hull integrity by 2 for the next 30 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                    {
                        id: 'test2',
                        positive: true,
                        icon: ExampleIcon2,
                        name: 'Emergency Repairs',
                        description: <>Increases hull integrity by 2 for the next 10 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                ],
            },
            {
                system: 'shields',
                health: 5,
                power: 5,
                effects: [
                    {
                        id: 'test4',
                        positive: false,
                        icon: ExampleIcon3,
                        name: 'Corrosion',
                        description: <>Increases hull integrity by 2 for the next 30 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                ],
            },
            {
                system: 'helm',
                health: 5,
                power: 5,
            },
            {
                system: 'sensors',
                health: 5,
                power: 5,
                effects: [
                    {
                        id: 'test5',
                        positive: true,
                        icon: ExampleIcon1,
                        name: 'Reinforced Plating',
                        description: <>Increases hull integrity by 2 for the next 30 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 30000 },
                    },
                    {
                        id: 'test6',
                        positive: true,
                        icon: ExampleIcon2,
                        name: 'Emergency Repairs',
                        description: <>Increases hull integrity by 2 for the next 10 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                    {
                        id: 'test18',
                        positive: true,
                        icon: ExampleIcon1,
                        name: 'Reinforced Plating',
                        description: <>Increases hull integrity by 2 for the next 30 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 30000 },
                    },
                    {
                        id: 'test19',
                        positive: false,
                        icon: ExampleIcon3,
                        name: 'Corrosion',
                        description: <>Increases hull integrity by 2 for the next 30 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                    {
                        id: 'test20',
                        positive: true,
                        icon: ExampleIcon2,
                        name: 'Emergency Repairs',
                        description: <>Increases hull integrity by 2 for the next 10 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                    {
                        id: 'test21',
                        positive: true,
                        icon: ExampleIcon1,
                        name: 'Reinforced Plating',
                        description: <>Increases hull integrity by 2 for the next 30 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 30000 },
                    },
                    {
                        id: 'test22',
                        positive: false,
                        icon: ExampleIcon3,
                        name: 'Corrosion',
                        description: <>Increases hull integrity by 2 for the next 30 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                    {
                        id: 'test23',
                        positive: true,
                        icon: ExampleIcon2,
                        name: 'Emergency Repairs',
                        description: <>Increases hull integrity by 2 for the next 10 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                ],
            },
            {
                system: 'tactical',
                health: 5,
                power: 5,
                effects: [
                    {
                        id: 'test7',
                        positive: true,
                        icon: ExampleIcon1,
                        name: 'Reinforced Plating',
                        description: <>Increases hull integrity by 2 for the next 30 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 30000 },
                    },
                    {
                        id: 'test8',
                        positive: false,
                        icon: ExampleIcon3,
                        name: 'Corrosion',
                        description: <>Increases hull integrity by 2 for the next 30 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                    {
                        id: 'test9',
                        positive: true,
                        icon: ExampleIcon2,
                        name: 'Emergency Repairs',
                        description: <>Increases hull integrity by 2 for the next 10 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                    {
                        id: 'test10',
                        positive: true,
                        icon: ExampleIcon2,
                        name: 'Emergency Repairs',
                        description: <>Increases hull integrity by 2 for the next 10 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                    {
                        id: 'test16',
                        positive: false,
                        icon: ExampleIcon3,
                        name: 'Corrosion',
                        description: <>Increases hull integrity by 2 for the next 30 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                    {
                        id: 'test17',
                        positive: true,
                        icon: ExampleIcon2,
                        name: 'Emergency Repairs',
                        description: <>Increases hull integrity by 2 for the next 10 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                ],
            },
            {
                system: 'engineer',
                health: 3,
                power: 5,
                effects: [
                    {
                        id: 'test11',
                        positive: true,
                        icon: ExampleIcon1,
                        name: 'Reinforced Plating',
                        description: <>Increases hull integrity by 2 for the next 30 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 30000 },
                    },
                    {
                        id: 'test12',
                        positive: false,
                        icon: ExampleIcon3,
                        name: 'Corrosion',
                        description: <>Increases hull integrity by 2 for the next 30 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                    {
                        id: 'test13',
                        positive: true,
                        icon: ExampleIcon2,
                        name: 'Emergency Repairs',
                        description: <>Increases hull integrity by 2 for the next 10 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                    {
                        id: 'test14',
                        positive: true,
                        icon: ExampleIcon2,
                        name: 'Emergency Repairs',
                        description: <>Increases hull integrity by 2 for the next 10 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                    {
                        id: 'test15',
                        positive: true,
                        icon: ExampleIcon2,
                        name: 'Emergency Repairs',
                        description: <>Increases hull integrity by 2 for the next 10 seconds.</>,
                        duration: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                ],
            },
        ],
        power: 5,
        maxHandSize: 5,
    },
};
