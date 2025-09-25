import { Card as Component } from './Card';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { default as ExampleIcon } from './icons/exampleIcon.svg?react';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'common-ui/Card',
    component: Component,
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Helm: Story = {
    args: {
        crew: 'helm',
        name: 'Some Card',
        description: 'A card that has a particular effect, for a particular crew role. Extra line!',
        descriptionLineHeight: 1.25,
        image: <ExampleIcon />,
        cost: 1,
    },
};

export const Tactical: Story = {
    args: {
        crew: 'tactical',
        name: 'Some Card with a longer title',
        description: 'A card that has a particular effect, for a particular crew role.',
        image: <ExampleIcon />,
        cost: 1,
    },
};

export const Sensors: Story = {
    args: {
        crew: 'sensors',
        name: 'Some Card with a title that\'s really quite long',
        nameFontSize: 0.88,
        description: 'A card that has a particular effect, for a particular crew role.',
        image: <ExampleIcon />,
        cost: 1,
    },
};

export const Engineering: Story = {
    args: {
        crew: 'engineer',
        name: 'Some Card',
        description: 'A card that has a particular effect, for a particular crew role.',
        image: <ExampleIcon />,
        cost: 1,
    },
};
