import { extendedShieldsRange } from 'common-data/features/ships/utils/extendedShields';
import { EffectLevel } from 'common-ui/components/EffectLevelContext';
import { defineUiEffects } from 'common-ui/content/UiContent';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import {
    autoDestructDamage, autoDestructRange, burnoutPowerPerLevel, bankPowerCharge, bankPowerLoss, emergencyPowerFlux, emergencyPowerGain, fluxLimit, railFeedPowerGain, redlineFluxInterval,
    redlinePowerGain, runQuietChargeInterval, runQuietPowerLoss,
} from 'content/systems/engineer/engineer.shared';
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
        description: <>{`This system is running ${runQuietPowerLoss} power lower, and gains 1 Charge every ${runQuietChargeInterval / 1000} seconds, until Run Quiet is played on it again.`}</>,
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
    charge: {
        name: 'Charge',
        description: <>
            This system holds
            {' '}
            <EffectLevel />
            {' '}
            Charge, until a card spends it.
        </>,
        image: ExampleIcon,
    },
    flux: {
        name: 'Flux',
        description: <>
            This system has
            {' '}
            <EffectLevel />
            {' '}
            plasma flux.
            {` At ${fluxLimit}, one of its cards is damaged and its flux is removed.`}
        </>,
        image: ExampleIcon,
    },
    bankingPower: {
        name: 'Banking Power',
        description: <>{`This system is running ${bankPowerLoss} power lower. When this ends, it gains ${bankPowerCharge} Charge.`}</>,
        image: ExampleIcon,
    },
    discharging: {
        name: 'Discharging',
        description: <>
            This system is spending its Charge, increasing its power by
            {' '}
            <EffectLevel />
            .
        </>,
        image: ExampleIcon,
    },
    redlining: {
        name: 'Redlining',
        description: <>{`This system is running ${redlinePowerGain} power higher, and gains 1 Flux every ${redlineFluxInterval / 1000} seconds, until Redline is played on it again.`}</>,
        image: ExampleIcon,
    },
    shieldsVented: {
        name: 'Shields Vented',
        description: <>Plasma flux is being vented through the hull, which is unpowered: the shields are down.</>,
        image: ExampleIcon,
    },
    railFeed: {
        name: 'Rail Feed',
        description: <>{`This system's column is being fed, increasing its power by ${railFeedPowerGain}.`}</>,
        image: ExampleIcon,
    },
    burningOut: {
        name: 'Burning Out',
        description: <>
            {`This system is running ${burnoutPowerPerLevel} power higher for each of the `}
            <EffectLevel />
            {' Flux that was spent on it. When this ends, it resets.'}
        </>,
        image: ExampleIcon,
    },
    busLinked: {
        name: 'Bus Linked',
        description: <>
            This system is linked to its neighbour's power bus, increasing its power by
            {' '}
            <EffectLevel />
            .
        </>,
        image: ExampleIcon,
    },
    buffered: {
        name: 'Buffered',
        description: <>The next hit that would damage one of this system's cards spends 1 of its Charge instead.</>,
        image: ExampleIcon,
    },
    autoDestructRequested: {
        name: 'Auto-destruct Requested',
        description: <>
            An auto-destruct is waiting for
            {' '}
            <EffectLevel />
            {' '}
            more of the crew to confirm it. If they don't in time, it lapses.
        </>,
        image: ExampleIcon,
    },
    autoDestructing: {
        name: 'Auto-destruct',
        description: <>{`When this runs out, the ship explodes, doing ${autoDestructDamage} damage to every ship within ${autoDestructRange} units. Play Abort Auto-destruct to stop it.`}</>,
        image: ExampleIcon,
    },
    cannibalised: {
        name: 'Cannibalised',
        description: <>
            This system's cards were damaged for parts. Graft can fully repair up to
            {' '}
            <EffectLevel />
            {' '}
            damaged cards on another system.
        </>,
        image: ExampleIcon,
    },
    emergencyPower: {
        name: 'Emergency Power',
        description: <>{`This system is running ${emergencyPowerGain} power higher. When this ends, it gains ${emergencyPowerFlux} Flux.`}</>,
        image: ExampleIcon,
    },
});
