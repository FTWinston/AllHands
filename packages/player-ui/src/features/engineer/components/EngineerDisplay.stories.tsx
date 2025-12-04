import { CardInstance } from 'common-data/types/CardInstance';
import { Cooldown } from 'common-data/types/Cooldown';
import { getCardDefinition } from 'common-ui/features/cards/utils/getCardDefinition';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fn } from 'storybook/test';
import { default as ExampleIcon1 } from '../../header/assets/energy.svg?react';
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
        const { power, cards, expendCard, handSize, powerGeneration, cardGeneration, priority, setPriority } = useFakePowerAndCards({
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

type UseFakePowerAndGenerationArgs = {
    power: number;
    maxPower: number;
    handSize: number;
    maxHandSize: number;
    priority: 'hand' | 'power';
    generateCard?: () => void;
};

export const useFakePowerAndGeneration = (args: UseFakePowerAndGenerationArgs) => {
    const [priority, setPriority] = useState<'hand' | 'power'>(args.priority);
    const [power, setPower] = useState(args.power);
    const [handSize, setHandSize] = useState(args.handSize);
    const justChanged = useRef(false);
    const generateCard = args.generateCard;

    const { maxPower, maxHandSize } = args;

    const [powerGeneration, setPowerGeneration] = useState<Cooldown | undefined>(undefined);
    const [cardGeneration, setCardGeneration] = useState<Cooldown | undefined>(undefined);

    const itemToGenerate = priority === 'hand'
        ? (handSize < maxHandSize ? 'hand' : power < maxPower ? 'power' : null)
        : (power < maxPower ? 'power' : handSize < maxHandSize ? 'hand' : null);

    useEffect(() => {
        justChanged.current = true;

        const adjustGeneration = () => {
            if (itemToGenerate === 'hand') {
                setCardGeneration({ startTime: Date.now(), endTime: Date.now() + 5000 });
                setPowerGeneration(undefined);
                if (!justChanged.current) {
                    setHandSize(handSize => Math.min(handSize + 1, maxHandSize));
                    generateCard?.();
                }
            } else if (itemToGenerate === 'power') {
                setPowerGeneration({ startTime: Date.now(), endTime: Date.now() + 5000 });
                setCardGeneration(undefined);
                if (!justChanged.current) {
                    setPower(power => Math.min(power + 1, maxPower));
                }
            } else {
                setPowerGeneration(undefined);
                setCardGeneration(undefined);
            }

            justChanged.current = false;
        };

        adjustGeneration();

        const interval = setInterval(adjustGeneration, 5000);

        return () => clearInterval(interval);
    }, [maxPower, maxHandSize, itemToGenerate, generateCard]);

    const drainPowerAndCard = (powerCost: number) => {
        if (power >= powerCost) {
            setPower(power - powerCost);
            setHandSize(handSize => Math.max(0, handSize - 1));
            return true;
        }

        return false;
    };

    return { power, drainPowerAndCard, handSize, powerGeneration, cardGeneration, priority, setPriority };
};

type UseFakePowerAndCardsArgs = UseFakePowerAndGenerationArgs & {
    cards: CardInstance[];
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

    const fakePowerAndGenerationArgs = {
        ...args,
        generateCard,
    };

    const { drainPowerAndCard, ...powerAndGenerationResults } = useFakePowerAndGeneration(fakePowerAndGenerationArgs);

    const expendCard = useCallback((cardId: number) => {
        setCards((cards) => {
            const playedCard = cards.find(c => c.id === cardId);
            const cost = playedCard ? getCardDefinition(playedCard.type).cost : 0;
            if (playedCard && cost && drainPowerAndCard(cost)) {
                return cards.filter(card => card !== playedCard);
            }
            return cards;
        });
    }, [drainPowerAndCard]);

    return {
        ...powerAndGenerationResults,
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
        power: 3,
        maxPower: 5,
        handSize: 3,
        maxHandSize: 5,
    },
};
