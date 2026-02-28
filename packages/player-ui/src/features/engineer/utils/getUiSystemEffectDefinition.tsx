import { systemEffectDefinitions, SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { SystemEffectDescription, UISystemEffectDefinition } from '../types/UISystemEffectDefinition';

function loadEffectDefinitions() {
    const effectDescriptions: Record<SystemEffectType, SystemEffectDescription> = {
        auxPower: {
            name: 'Aux Power',
            description: <>This system is currently receiving auxiliary power, increasing its power level by 1.</>,
            image: ExampleIcon,
        },
        reducedPower1: {
            name: 'Reduced Power',
            description: <>Reactor damage is causing this system to be affected by reduced power, decreasing its power level by 1.</>,
            image: ExampleIcon,
        },
        reducedPower2: {
            name: 'Greatly Reduced Power',
            description: <>Reactor damage is causing this system to be affected by reduced power, decreasing its power level by 2.</>,
            image: ExampleIcon,
        },
        reducedPower3: {
            name: 'Severely Reduced Power',
            description: <>Reactor damage is causing this system to be affected by reduced power, decreasing its power level by 3.</>,
            image: ExampleIcon,
        },
        reducedPower4: {
            name: 'Critically Reduced Power',
            description: <>Reactor damage is causing this system to be affected by reduced power, decreasing its power level by 4.</>,
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
