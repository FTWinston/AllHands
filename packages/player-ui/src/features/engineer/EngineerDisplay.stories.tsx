import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { useEffect, useRef, useState } from 'react';
import { Cooldown } from 'src/types/Cooldown';
import { fn } from 'storybook/test';
import { EngineerDisplay as Component } from './EngineerDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Engineer',
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

export const Engineer: Story = {
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
                targetType: 'no-target',
                name: 'Some Card with a longer title',
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 3,
                crew: 'engineer',
                targetType: 'no-target',
                name: 'Some Card with a title that\'s really quite long',
                nameFontSize: 0.88,
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
        ],
        power: 2,
        maxPower: 5,
        handSize: 4,
        maxHandSize: 5,
    },
};
