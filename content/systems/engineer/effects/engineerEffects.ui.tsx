import { extendedShieldsRange } from 'common-data/features/ships/utils/extendedShields';
import { EffectLevel } from 'common-ui/components/EffectLevelContext';
import { defineUiEffects } from 'common-ui/content/UiContent';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { runQuietPowerLoss } from 'content/systems/engineer/engineer.shared';
import { effects as sharedEffects } from './engineerEffects.shared';

export const effects = defineUiEffects(sharedEffects, {
    auxPower: {
        name: 'Aux Power',
        description: <>This system is currently receiving auxiliary power, increasing its power level by 1.</>,
        image: ExampleIcon,
    },
    shieldFocus: {
        name: 'Shield Focus',
        description: <>Shields are focused on this system, increasing its protection by 50%.</>,
        image: ExampleIcon,
    },
    shieldsExtended: {
        name: 'Shields Extended',
        description: <>{`The shields are extended over friendly ships within ${extendedShieldsRange} units: hits on them drain these shields, not theirs.`}</>,
        image: ExampleIcon,
    },
    powerReceived: {
        name: 'Power Received',
        description: <>Another ship is powering this one.</>,
        image: ExampleIcon,
    },
    runningQuiet: {
        name: 'Running Quiet',
        description: <>{`This system is running ${runQuietPowerLoss} power lower, until Run Quiet is played on it again.`}</>,
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
    divertScienceGain: {
        name: 'Science Power Diverted Here',
        description: <>
            Science power has been diverted to this system, increasing its power by
            {' '}
            <EffectLevel />
            .
        </>,
        image: ExampleIcon,
    },
    divertScienceLoss: {
        name: 'Science Power Diverted',
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
});
