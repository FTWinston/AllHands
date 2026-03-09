import { systemEffectDefinitions, SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { EffectLevel } from '../components/EffectLevelContext';
import { SystemEffectDescription, UISystemEffectDefinition } from '../types/UISystemEffectDefinition';

function loadEffectDefinitions() {
    const effectDescriptions: Record<SystemEffectType, SystemEffectDescription> = {
        shield: {
            name: 'Shields',
            description: <>
                Protects the ship from damage. Recharged by hull energy level, each time the hull generates.
                The higher the shield strength (currently at
                {' '}
                <EffectLevel />
                %), the greater a proportion of damage it absorbs.
            </>,
            image: ExampleIcon,
        },
        auxPower: {
            name: 'Aux Power',
            description: <>This system is currently receiving auxiliary power, increasing its power level by 1.</>,
            image: ExampleIcon,
        },
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
        disruptGeneration: {
            name: 'Disrupted',
            description: <>
                This system is being disrupted, and will not generate for the next
                {' '}
                <EffectLevel />
                {' '}
                attempts.
            </>,
            image: ExampleIcon,
        },
        feedback: {
            name: 'Feedback',
            description: <>
                This system will take
                {' '}
                <EffectLevel />
                {' '}
                damage every time it generates.
            </>,
            image: ExampleIcon,
        },
        something1: {
            name: 'Something 1',
            description: <>Some effect description goes here.</>,
            image: ExampleIcon,
        },
        something2: {
            name: 'Something 2',
            description: <>Some effect description goes here.</>,
            image: ExampleIcon,
        },
        something3: {
            name: 'Something 3',
            description: <>Some effect description goes here.</>,
            image: ExampleIcon,
        },
        something4: {
            name: 'Something 4',
            description: <>Some effect description goes here.</>,
            image: ExampleIcon,
        },
        something5: {
            name: 'Something 5',
            description: <>Some effect description goes here.</>,
            image: ExampleIcon,
        },
        something6: {
            name: 'Something 6',
            description: <>Some effect description goes here.</>,
            image: ExampleIcon,
        },
        something7: {
            name: 'Something 7',
            description: <>Some effect description goes here.</>,
            image: ExampleIcon,
        },
        something8: {
            name: 'Something 8',
            description: <>Some effect description goes here.</>,
            image: ExampleIcon,
        },
    };

    const uiEffectDefinitions = Object.entries(effectDescriptions)
        .reduce((acc, [type, desc]) => {
            acc[type as SystemEffectType] = { ...systemEffectDefinitions[type as SystemEffectType], ...desc };
            return acc;
        }, {} as Record<SystemEffectType, UISystemEffectDefinition>);
    return uiEffectDefinitions;
}

const uiEffectDefinitions = loadEffectDefinitions();

export const getSystemEffectDefinition = (type: SystemEffectType): UISystemEffectDefinition => {
    const effectDef: UISystemEffectDefinition = uiEffectDefinitions[type];

    if (!effectDef) {
        throw new Error(`System effect definition not found: ${type}`);
    }

    return effectDef;
};
