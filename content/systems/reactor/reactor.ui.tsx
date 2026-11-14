import { EffectLevel } from 'common-ui/components/EffectLevelContext';
import { defineUiContent } from 'common-ui/content/UiContent';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { reactorShared } from './reactor.shared';

export const reactorUi = defineUiContent({
    shared: reactorShared,
    cards: {
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
    },
    effects: {
        reducedPower: {
            name: 'Reduced Power',
            description: <>
                Reactor damage has decreased the power available to this systemby
                {' '}
                <EffectLevel />
                .
            </>,
            image: ExampleIcon,
        },
    },
});
