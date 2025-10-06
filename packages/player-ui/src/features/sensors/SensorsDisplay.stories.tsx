import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { SensorsDisplay as Component } from './SensorsDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Sensors',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        onPause: fn(),
    },
    render: (args) => {
        const [priority, setPriority] = useState<'hand' | 'power'>(args.priority ?? 'hand');

        return (
            <Component
                {...args}
                priority={priority}
                setPriority={setPriority}
            />
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Sensors: Story = {
    args: {
        cards: [
            {
                id: 1,
                crew: 'sensors',
                targetType: 'something',
                name: 'Some Card',
                description: 'A card that has a particular effect, for a particular crew role. Extra line!',
                descriptionLineHeight: 1.25,
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 2,
                crew: 'sensors',
                targetType: 'else',
                name: 'Some Card with a longer title',
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
            {
                id: 3,
                crew: 'sensors',
                targetType: 'else',
                name: 'Some Card with a title that\'s really quite long',
                nameFontSize: 0.88,
                description: 'A card that has a particular effect, for a particular crew role.',
                image: <ExampleIcon />,
                cost: 1,
            },
        ],
    },
};
