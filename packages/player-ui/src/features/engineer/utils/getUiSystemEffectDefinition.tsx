import { systemEffectDefinitions, SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { SystemEffectDescription, UISystemEffectDefinition } from '../types/UISystemEffectDefinition';

function loadEffectDefinitions() {
    const effectDescriptions: Record<SystemEffectType, SystemEffectDescription> = {
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
