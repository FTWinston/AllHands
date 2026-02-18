import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { Cooldown } from 'common-data/types/Cooldown';
import { MinimalReadonlyArray } from 'common-data/types/MinimalArray';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fn } from 'storybook/test';
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
                type: 'auxPower',
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
                type: 'auxPower',
            },
            {
                id: 2,
                type: 'auxPower',
            },
            {
                id: 3,
                type: 'auxPower',
            },
        ],
        systems: [
            {
                system: 'hull',
                health: 10,
                power: 5,
                generating: true,
                effects: [
                    {
                        type: 'something1',
                        progress: { startTime: Date.now(), endTime: Date.now() + 30000 },
                    },
                    {
                        type: 'something2',
                        progress: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                    {
                        type: 'something3',
                        progress: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                ],
            },
            {
                system: 'shields',
                health: 5,
                power: 5,
                generating: false,
                effects: [
                    {
                        type: 'something2',
                        progress: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                ],
            },
            {
                system: 'helm',
                health: 5,
                power: 5,
                generating: false,
            },
            {
                system: 'sensors',
                health: 5,
                power: 5,
                generating: false,
                effects: [
                    {
                        type: 'something2',
                        progress: { startTime: Date.now(), endTime: Date.now() + 30000 },
                    },
                    {
                        type: 'something3',
                        progress: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                    {
                        type: 'something1',
                        progress: { startTime: Date.now(), endTime: Date.now() + 30000 },
                    },
                    {
                        type: 'something4',
                        progress: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                    {
                        type: 'something5',
                        progress: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                    {
                        type: 'something6',
                        progress: { startTime: Date.now(), endTime: Date.now() + 30000 },
                    },
                    {
                        type: 'something7',
                        progress: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                    {
                        type: 'something8',
                        progress: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                ],
            },
            {
                system: 'tactical',
                health: 5,
                power: 5,
                generating: false,
                effects: [
                    {
                        type: 'something1',
                        progress: { startTime: Date.now(), endTime: Date.now() + 30000 },
                    },
                    {
                        type: 'something2',
                        progress: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                    {
                        type: 'something3',
                        progress: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                    {
                        type: 'something4',
                        progress: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                    {
                        type: 'something5',
                        progress: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                    {
                        type: 'something6',
                        progress: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                ],
            },
            {
                system: 'engineer',
                health: 3,
                power: 5,
                generating: false,
                effects: [
                    {
                        type: 'something2',
                        progress: { startTime: Date.now(), endTime: Date.now() + 30000 },
                    },
                    {
                        type: 'something5',
                        progress: { startTime: Date.now(), endTime: Date.now() + 20000 },
                    },
                    {
                        type: 'something3',
                        progress: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                    {
                        type: 'something1',
                        progress: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                    {
                        type: 'something4',
                        progress: { startTime: Date.now(), endTime: Date.now() + 10000 },
                    },
                ],
            },
        ],
        power: 5,
        maxHandSize: 5,
    },
};
