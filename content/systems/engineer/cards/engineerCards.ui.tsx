import { defineUiCards } from 'common-ui/content/UiContent';
import { Parameter } from 'common-ui/features/cards/components/Parameter';
import { Trait } from 'common-ui/features/cards/components/Trait';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { cards as sharedCards } from './engineerCards.shared';

export const cards = defineUiCards(sharedCards, {
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
            power lower, and gains
            {' '}
            <Parameter name="charge" />
            {' '}
            Charge every
            {' '}
            <Parameter name="interval" />
            {' '}
            seconds. Play it again to bring it back.
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
    trickleCharge: {
        name: 'Trickle Charge',
        description: <>
            A system gains
            {' '}
            <Parameter name="charge" />
            {' '}
            Charge, which stays until it's spent.
        </>,
        image: <ExampleIcon />,
    },
    bankPower: {
        name: 'Bank Power',
        description: <>
            A system runs
            {' '}
            <Parameter name="powerChange" />
            {' '}
            power lower for
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds. When that ends, it gains
            {' '}
            <Parameter name="charge" />
            {' '}
            Charge.
        </>,
        image: <ExampleIcon />,
    },
    discharge: {
        name: 'Discharge',
        description: <>
            Spend all of a system's Charge: it gains
            {' '}
            <Parameter name="powerGain" />
            {' '}
            power per Charge for
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds.
        </>,
        image: <ExampleIcon />,
    },
    surgeDraw: {
        name: 'Surge Draw',
        description: <>
            Spend all of a system's Charge: it draws
            {' '}
            <Parameter name="cardsPerLevel" />
            {' '}
            card per Charge.
        </>,
        image: <ExampleIcon />,
    },
    redline: {
        name: 'Redline',
        description: <>
            A system runs
            {' '}
            <Parameter name="powerGain" />
            {' '}
            power higher, and gains
            {' '}
            <Parameter name="flux" />
            {' '}
            Flux every
            {' '}
            <Parameter name="interval" />
            {' '}
            seconds. Play it again to stop.
        </>,
        image: <ExampleIcon />,
    },
    vent: {
        name: 'Vent',
        description: <>
            Remove all Flux from every system. The hull is unpowered, so the shields are down, for
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds.
        </>,
        image: <ExampleIcon />,
    },
    railFeed: {
        name: 'Rail Feed',
        description: <>
            Every system in a column gains
            {' '}
            <Parameter name="powerGain" />
            {' '}
            power for
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds.
        </>,
        image: <ExampleIcon />,
    },
    priorityFeed: {
        name: 'Priority Feed',
        description: <>
            A system draws
            {' '}
            <Parameter name="cards" />
            {' '}
            card now.
        </>,
        image: <ExampleIcon />,
    },
    buffer: {
        name: 'Buffer',
        description: <>
            The next hit that would damage one of a system's cards spends
            {' '}
            <Parameter name="charge" />
            {' '}
            of its Charge instead.
        </>,
        image: <ExampleIcon />,
    },
    hotStart: {
        name: 'Hot Start',
        description: <>
            A system draws
            {' '}
            <Parameter name="cards" />
            {' '}
            cards now, and gains
            {' '}
            <Parameter name="flux" />
            {' '}
            Flux.
        </>,
        image: <ExampleIcon />,
    },
    extremeMeasures: {
        name: 'Extreme Measures',
        description: 'Choose a desperate measure: auto-destruct, cannibalise a system, or emergency power.',
        image: <ExampleIcon />,
    },
    autoDestruct: {
        name: 'Auto-destruct',
        description: <>
            In
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds, the ship explodes, doing
            {' '}
            <Parameter name="damage" />
            {' '}
            damage to every ship within
            {' '}
            <Parameter name="range" />
            {' '}
            units, once
            {' '}
            <Parameter name="confirmations" />
            {' '}
            of the rest of the crew confirm it within
            {' '}
            <Parameter name="window" />
            {' '}
            seconds. Gives each of them a Confirm Auto-destruct card, and adds an Abort Auto-destruct card to your hand when it starts.
        </>,
        image: <ExampleIcon />,
    },
    confirmAutoDestruct: {
        name: 'Confirm Auto-destruct',
        description: <>
            <Trait trait="expendable" />
            {' '}
            <Trait trait="priority" />
            {' '}
            Confirm the engineer's auto-destruct request.
        </>,
        image: <ExampleIcon />,
    },
    abortAutoDestruct: {
        name: 'Abort Auto-destruct',
        description: <>
            <Trait trait="expendable" />
            {' '}
            <Trait trait="priority" />
            {' '}
            Stop the auto-destruct countdown.
        </>,
        image: <ExampleIcon />,
    },
    cannibalise: {
        name: 'Cannibalise',
        description: 'Damage every card of a system (other than the hull). Adds a Graft card to your hand.',
        image: <ExampleIcon />,
    },
    graft: {
        name: 'Graft',
        description: <>
            <Trait trait="expendable" />
            {' '}
            Fully repair as many of a system's damaged cards as Cannibalise damaged.
        </>,
        image: <ExampleIcon />,
    },
    emergencyPower: {
        name: 'Emergency Power',
        description: <>
            Every system gains
            {' '}
            <Parameter name="powerGain" />
            {' '}
            power for
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds. When that ends, each gains
            {' '}
            <Parameter name="flux" />
            {' '}
            Flux.
        </>,
        image: <ExampleIcon />,
    },
});
