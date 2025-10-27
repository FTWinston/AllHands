import { Cooldown } from 'common-types';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { useEffect, useRef, useState } from 'react';
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

export const useFakePowerAndGeneration = (args: { power: number; maxPower: number; handSize: number; maxHandSize: number; priority: 'hand' | 'power' }) => {
    const [priority, setPriority] = useState<'hand' | 'power'>(args.priority);
    const [power, setPower] = useState(args.power);
    const [handSize, setHandSize] = useState(args.handSize);
    const justChanged = useRef(false);

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
    }, [maxPower, maxHandSize, itemToGenerate]);

    return { power, handSize, powerGeneration, cardGeneration, priority, setPriority };
};

export const UI: Story = {
    args: {
        cards: [
            {
                id: 1,
                crew: 'engineer',
                targetType: 'no-target',
                name: 'Some Card',
                description: 'A card that has a particular effect, for a particular crew role. Extra line!',
                descriptionLineHeight: 1.25,
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 2,
                crew: 'engineer',
                targetType: 'system',
                name: 'Some Card with a longer title',
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 3,
                crew: 'engineer',
                targetType: 'system',
                name: 'Some Card with a title that\'s really quite long',
                nameFontSize: 0.88,
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
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
                health: 5,
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
        power: 2,
        maxPower: 5,
        handSize: 4,
        maxHandSize: 5,
    },
};
