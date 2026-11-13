import { extendedShieldsRange } from 'common-data/features/ships/utils/extendedShields';
import { EffectLevel } from 'common-ui/components/EffectLevelContext';
import { defineUiContent } from 'common-ui/content/UiContent';
import { Parameter } from 'common-ui/features/cards/components/Parameter';
import { Trait } from 'common-ui/features/cards/components/Trait';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { runQuietPowerLoss, engineerShared } from './engineer.shared';

export const engineerUi = defineUiContent({
    shared: engineerShared,
    cards: {
        smokeScreen: {
            name: 'Smoke Screen',
            description: 'Deploy a smoke screen to obscure vision and provide cover.',
            image: <ExampleIcon />,
        },
        auxPower: {
            name: 'Aux Power',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Increase a system's power level by
                {' '}
                <Parameter name="powerGain" />
                , removing this effect from all other systems.
            </>,
            image: <ExampleIcon />,
        },
        swapSystems: {
            name: 'Swap Systems',
            description: 'Swap the position of a system with its neighbor.',
            image: <ExampleIcon />,
        },
        swapHorizontal: {
            name: 'Swap Horizontal',
            description: 'Swap a system with the one to its left or right.',
            image: <ExampleIcon />,
        },
        swapUp: {
            name: 'Swap Up',
            description: 'Swap a system with the one above it.',
            image: <ExampleIcon />,
        },
        swapDown: {
            name: 'Swap Down',
            description: 'Swap a system with the one below it.',
            image: <ExampleIcon />,
        },
        purge: {
            name: 'Purge',
            description: 'Permanently remove a negative effect from a system.',
            image: <ExampleIcon />,
        },
        reset: {
            name: 'Reset',
            description: <>
                Disables all power to a system for
                <Parameter name="duration" />
                {' '}
                seconds, then remove all effects.
            </>,
            image: <ExampleIcon />,
        },
        focusShields: {
            name: 'Focus Shields',
            description: <>
                Focus shields on a system, increasing its protection by
                <Parameter name="shieldBoost" />
                % but decreasing the protection of all other systems (except the hull) by
                <Parameter name="shieldReduction" />
                %.
            </>,
            image: <ExampleIcon />,
        },
        extendShields: {
            name: 'Extend Shields',
            description: <>
                For
                {' '}
                <Parameter name="duration" />
                {' '}
                seconds, hits on friendly ships within
                {' '}
                <Parameter name="range" />
                {' '}
                units land on your shields, not theirs.
            </>,
            image: <ExampleIcon />,
        },
        transferPower: {
            name: 'Transfer Power',
            description: <>
                For
                {' '}
                <Parameter name="duration" />
                {' '}
                seconds, the nearest friendly ship within
                {' '}
                <Parameter name="range" />
                {' '}
                units is powered from yours.
            </>,
            image: <ExampleIcon />,
        },
        runQuiet: {
            name: 'Run Quiet',
            description: <>
                This system runs
                {' '}
                <Parameter name="powerChange" />
                {' '}
                power lower. Play it again to bring it back.
            </>,
            image: <ExampleIcon />,
        },
        relocateSystem: {
            name: 'Relocate System',
            description: 'Mark a system for relocation. Adds a Relocate Here card to your hand to place it in any position.',
            image: <ExampleIcon />,
        },
        relocateHere: {
            name: 'Relocate Here',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Swap the marked system with the targeted system.
            </>,
            image: <ExampleIcon />,
        },
        sustain: {
            name: 'Sustain',
            description: 'Restart the cooldown on every status effect on a system.',
            image: <ExampleIcon />,
        },
        distributePower: {
            name: 'Distribute Power',
            description: <>
                Reduce a system's power by
                <Parameter name="powerChange" />
                {' '}
                per adjacent system, increasing the power of each adjacent system by
                <Parameter name="powerChange" />
                {' '}
                for
                <Parameter name="duration" />
                {' '}
                seconds.
            </>,
            image: <ExampleIcon />,
        },
        drawPower: {
            name: 'Draw Power',
            description: <>
                Increase a system's power by
                <Parameter name="powerChange" />
                {' '}
                per adjacent system, decreasing the power of each adjacent system by
                <Parameter name="powerChange" />
                {' '}
                for
                <Parameter name="duration" />
                {' '}
                seconds.
            </>,
            image: <ExampleIcon />,
        },
        divertAllPower: {
            name: 'Divert All Power',
            description: <>
                All other systems lose
                <Parameter name="lossPerSystem" />
                {' '}
                power for
                <Parameter name="duration" />
                {' '}
                seconds. Target system gains
                <Parameter name="targetGain" />
                {' '}
                power.
            </>,
            image: <ExampleIcon />,
        },
        divertSystemPower: {
            name: 'Divert System Power',
            description: 'Choose which system to divert power from.',
            image: <ExampleIcon />,
        },
        divertHelm: {
            name: 'Divert Helm',
            description: <>
                Reduce helm power by up to
                <Parameter name="maxAmount" />
                , increasing target system power by the same amount for
                <Parameter name="duration" />
                {' '}
                seconds.
            </>,
            image: <ExampleIcon />,
        },
        divertScience: {
            name: 'Divert Science',
            description: <>
                Reduce science power by up to
                <Parameter name="maxAmount" />
                , increasing target system power by the same amount for
                <Parameter name="duration" />
                {' '}
                seconds.
            </>,
            image: <ExampleIcon />,
        },
        divertTactical: {
            name: 'Divert Tactical',
            description: <>
                Reduce tactical power by up to
                <Parameter name="maxAmount" />
                , increasing target system power by the same amount for
                <Parameter name="duration" />
                {' '}
                seconds.
            </>,
            image: <ExampleIcon />,
        },
        overcharge: {
            name: 'Overcharge',
            description: <>
                Target system gains
                <Parameter name="powerGain" />
                {' '}
                power for
                <Parameter name="duration" />
                {' '}
                seconds, but takes damage every second for the duration.
            </>,
            image: <ExampleIcon />,
        },
        shunt: {
            name: 'Shunt',
            description: 'Swap all status effects between a system and its horizontal neighbor, preserving cooldowns.',
            image: <ExampleIcon />,
        },
        drawPriority: {
            name: 'Draw Priority',
            description: <>
                Adds an
                {' '}
                <Trait trait="expendable" external />
                {' '}
                copy of this system's card before each regular card in the reactor deck.
            </>,
            image: <ExampleIcon />,
        },
    },
    effects: {
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
    },
});
