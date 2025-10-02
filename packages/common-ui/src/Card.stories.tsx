import { Card as Component } from './Card';
import { default as ExampleIcon } from './icons/exampleIcon.svg?react';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
    title: 'common-ui/Card',
    component: Component,
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Helm: Story = {
    args: {
        id: 1,
        crew: 'helm',
        targetType: 'something',
        name: 'Some Card',
        description: 'A card that has a particular effect, for a particular crew role. Extra line!',
        descriptionLineHeight: 1.25,
        image: <ExampleIcon />,
        cost: 1,
    },
};

export const Tactical: Story = {
    args: {
        id: 1,
        crew: 'tactical',
        targetType: 'something',
        name: 'Some Card with a longer title',
        description: 'A card that has a particular effect, for a particular crew role.',
        image: <ExampleIcon />,
        cost: 1,
    },
};

export const Sensors: Story = {
    args: {
        id: 1,
        crew: 'sensors',
        targetType: 'something',
        name: 'Some Card with a title that\'s really quite long',
        nameFontSize: 0.88,
        description: 'A card that has a particular effect, for a particular crew role.',
        image: <ExampleIcon />,
        cost: 1,
    },
};

export const Engineering: Story = {
    args: {
        id: 1,
        crew: 'engineer',
        targetType: 'something',
        name: 'Some Card',
        description: 'A card that has a particular effect, for a particular crew role.',
        image: <ExampleIcon />,
        cost: 1,
    },
};
