import { defineUiCards } from 'common-ui/content/UiContent';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { cards as sharedCards } from './reactorCards.shared';

export const cards = defineUiCards(sharedCards, {
    reactorPowerHull: {
        name: 'Hull Power',
        description: 'Provide power to the hull system.',
        image: <ExampleIcon />,
    },
    reactorPowerReactor: {
        name: 'Reactor Power',
        description: 'Provide power to the reactor system.',
        image: <ExampleIcon />,
    },
    reactorPowerHelm: {
        name: 'Helm Power',
        description: 'Provide power to the helm system.',
        image: <ExampleIcon />,
    },
    reactorPowerScience: {
        name: 'Science Power',
        description: 'Provide power to the science system.',
        image: <ExampleIcon />,
    },
    reactorPowerTactical: {
        name: 'Tactical Power',
        description: 'Provide power to the tactical system.',
        image: <ExampleIcon />,
    },
    reactorPowerEngineer: {
        name: 'Engineer Power',
        description: 'Provide power to the engineer system.',
        image: <ExampleIcon />,
    },
});
