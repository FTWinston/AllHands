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
        shieldFocus: {
            name: 'Shield Focus',
            description: <>Shields are focused on this system, increasing its protection by 50%.</>,
            image: ExampleIcon,
        },
        shieldReduced: {
            name: 'Shield Reduced',
            description: <>Shields are focused on another system, decreasing this system's protection by 10%.</>,
            image: ExampleIcon,
        },
        resetting: {
            name: 'Resetting',
            description: <>This system is resetting, and is briefly unavailable.</>,
            image: ExampleIcon,
        },
        reactorBreach: {
            name: 'Reactor Breach',
            description: <>The reactor has breached. The ship will be destroyed.</>,
            image: ExampleIcon,
        },
        relocating: {
            name: 'Relocating',
            description: <>This system is marked for relocation. Play the Relocate Here card to move it to a new position.</>,
            image: ExampleIcon,
        },
        overcharge: {
            name: 'Overcharge',
            description: <>This system is overcharged, gaining 3 power but taking damage every second.</>,
            image: ExampleIcon,
        },
        distributePowerLoss: {
            name: 'Distributing Power',
            description: <>
                This system is distributing power to its neighbors, reducing its power by
                {' '}
                <EffectLevel />
                .
            </>,
            image: ExampleIcon,
        },
        distributePowerGain: {
            name: 'Receiving Power',
            description: <>This system is receiving distributed power, increasing its power by 1.</>,
            image: ExampleIcon,
        },
        drawPowerGain: {
            name: 'Drawing Power',
            description: <>
                This system is drawing power from its neighbors, increasing its power by
                {' '}
                <EffectLevel />
                .
            </>,
            image: ExampleIcon,
        },
        drawPowerLoss: {
            name: 'Power Drawn',
            description: <>This system is having power drawn from it, reducing its power by 1.</>,
            image: ExampleIcon,
        },
        divertAllPowerGain: {
            name: 'All Power Diverted',
            description: <>
                All power has been diverted to this system, increasing its power by
                {' '}
                <EffectLevel />
                .
            </>,
            image: ExampleIcon,
        },
        divertAllPowerLoss: {
            name: 'Power Diverted Away',
            description: <>Power has been diverted away from this system, reducing its power by 1.</>,
            image: ExampleIcon,
        },
        divertHelmGain: {
            name: 'Helm Power Diverted Here',
            description: <>
                Helm power has been diverted to this system, increasing its power by
                {' '}
                <EffectLevel />
                .
            </>,
            image: ExampleIcon,
        },
        divertHelmLoss: {
            name: 'Helm Power Diverted',
            description: <>
                This system's power has been diverted, reducing its power by
                {' '}
                <EffectLevel />
                .
            </>,
            image: ExampleIcon,
        },
        divertSensorsGain: {
            name: 'Sensors Power Diverted Here',
            description: <>
                Sensors power has been diverted to this system, increasing its power by
                {' '}
                <EffectLevel />
                .
            </>,
            image: ExampleIcon,
        },
        divertSensorsLoss: {
            name: 'Sensors Power Diverted',
            description: <>
                This system's power has been diverted, reducing its power by
                {' '}
                <EffectLevel />
                .
            </>,
            image: ExampleIcon,
        },
        divertTacticalGain: {
            name: 'Tactical Power Diverted Here',
            description: <>
                Tactical power has been diverted to this system, increasing its power by
                {' '}
                <EffectLevel />
                .
            </>,
            image: ExampleIcon,
        },
        divertTacticalLoss: {
            name: 'Tactical Power Diverted',
            description: <>
                This system's power has been diverted, reducing its power by
                {' '}
                <EffectLevel />
                .
            </>,
            image: ExampleIcon,
        },
        generationPriority: {
            name: 'Generation Priority',
            description: <>
                This system generates after any other system generates, but skips its own slot in the sequence.
            </>,
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
