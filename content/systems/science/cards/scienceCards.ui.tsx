import { defineUiCards } from 'common-ui/content/UiContent';
import { Parameter } from 'common-ui/features/cards/components/Parameter';
import { Trait } from 'common-ui/features/cards/components/Trait';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { cards as sharedCards } from './scienceCards.shared';

export const cards = defineUiCards(sharedCards, {
    passiveScan: {
        name: 'Passive Scan',
        description: <>
            No special behaviour.
        </>,
        image: <ExampleIcon />,
    },
    antiprotonScan: {
        name: 'Antiproton Scan',
        description: <>
            Scanning a system increases its damage taken from all sources by
            {' '}
            <Parameter name="effectLevel" />
            % for
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds.
        </>,
        image: <ExampleIcon />,
    },
    tetryonScan: {
        name: 'Tetryon Scan',
        description: <>
            Finding a vulnerability scrambles the target ship's shields, cancelling their tuning, and stopping the next
            {' '}
            <Parameter name="scrambleCards" />
            {' '}
            hull cards that would tune them from doing so.
        </>,
        image: <ExampleIcon />,
    },
    chronitonScan: {
        name: 'Chroniton Scan',
        description: <>
            Scanning a system causes it to fail every other card draw, for
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds.
        </>,
        image: <ExampleIcon />,
    },
    polaronScan: {
        name: 'Polaron Scan',
        description: <>
            Finding a vulnerability reduces the target system's available power by
            {' '}
            <Parameter name="effectLevel" />
            {' '}
            for
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds.
        </>,
        image: <ExampleIcon />,
    },
    invertedPulseScan: {
        name: 'Inverted Pulse Scan',
        description: <>
            Finding a vulnerability draws 2 cards.
        </>,
        image: <ExampleIcon />,
    },
    coherentBeamScan: {
        name: 'Coherent Beam Scan',
        description: <>
            Scanning a system also finds a vulnerability.
        </>,
        image: <ExampleIcon />,
    },
    phasedBurstScan: {
        name: 'Phased Burst Scan',
        description: <>
            Scanning a system reduces the cost of your next card played by 1.
        </>,
        image: <ExampleIcon />,
    },
    phasedPolaronScan: {
        name: 'Phased Polaron Scan',
        description: <>
            Scanning a system increases your available power by 1 for
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds.
        </>,
        image: <ExampleIcon />,
    },
    coherentTetryonScan: {
        name: 'Coherent Tetryon Scan',
        description: <>
            Scanning a system increases the chance for weapons to hit that system by
            {' '}
            <Parameter name="accuracyIncrease" />
            %.
        </>,
        image: <ExampleIcon />,
    },
    coherentChronitonScan: {
        name: 'Coherent Chroniton Scan',
        description: <>
            Finding a vulnerability fills your hand with
            {' '}
            <Trait trait="expendable" external />
            {' '}
            copies of the last drawn card.
        </>,
        image: <ExampleIcon />,
    },
    invertedAntiprotonScan: {
        name: 'Inverted Antiproton Scan',
        description: <>
            Scanning a system increases the damage taken of all other target systems by
            {' '}
            <Parameter name="effectLevel" />
            % for
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds.
        </>,
        image: <ExampleIcon />,
    },
    invertedChronitonScan: {
        name: 'Inverted Chroniton Scan',
        description: <>
            Finding a vulnerability fills your hand with cards from the bottom of your deck.
        </>,
        image: <ExampleIcon />,
    },
    deepScan: {
        name: 'Deep Scan',
        description: <>
            Scanning a system also reads its hand.
        </>,
        image: <ExampleIcon />,
    },
    gravitonScan: {
        name: 'Graviton Scan',
        description: <>
            Scanning a system makes manoeuvres the target ship starts
            {' '}
            <Parameter name="effectLevel" />
            % slower, for
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds.
        </>,
        image: <ExampleIcon />,
    },
    crossReference: {
        name: 'Cross-reference',
        description: <>
            Revealing a system that has been revealed before gains
            {' '}
            <Parameter name="extraInsight" />
            {' '}
            extra Insight.
        </>,
        image: <ExampleIcon />,
    },
    activePing: {
        name: 'Active Ping',
        description: <>
            Reveals every system of the target ship at once. Every hostile ship within
            {' '}
            <Parameter name="range" />
            {' '}
            learns where this ship is, for
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds.
        </>,
        image: <ExampleIcon />,
    },
    passiveListen: {
        name: 'Passive Listen',
        description: <>
            Reveals a system after
            {' '}
            <Parameter name="delay" />
            {' '}
            seconds, without being noticed.
        </>,
        image: <ExampleIcon />,
    },
    jam: {
        name: 'Jam',
        description: <>
            For
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds, scans of this ship by other ships fail.
        </>,
        image: <ExampleIcon />,
    },
    sensorGhost: {
        name: 'Sensor Ghost',
        description: <>
            Leave a ghost where this ship is, flying on as the ship is now, for
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds. Hostile ships take it for this ship, and can target, scan and shoot it, but anything that does finds nothing there, and it vanishes.
        </>,
        image: <ExampleIcon />,
    },
    firingSolution: {
        name: 'Firing Solution',
        description: <>
            Spend
            {' '}
            <Parameter name="insightCost" />
            {' '}
            Insight: tactical is given an
            {' '}
            <Trait trait="expendable" external />
            {' '}
            card that makes a weapon's next shot more accurate.
        </>,
        image: <ExampleIcon />,
    },
    firingSolutionShot: {
        name: 'Calculated Shot',
        description: <>
            <Trait trait="expendable" />
            {' '}
            The weapon's next shot is
            {' '}
            <Parameter name="accuracyIncrease" />
            % more accurate. It doesn't count as a modifier.
        </>,
        image: <ExampleIcon />,
    },
    plottedCourse: {
        name: 'Plotted Course',
        description: <>
            Spend
            {' '}
            <Parameter name="insightCost" />
            {' '}
            Insight: helm is given an
            {' '}
            <Trait trait="expendable" external />
            {' '}
            manoeuvre, that flies fast and is hard to hit.
        </>,
        image: <ExampleIcon />,
    },
    plottedCourseManoeuvre: {
        name: 'Flank Run',
        description: <>
            <Trait trait="expendable" />
            {' '}
            A plotted course: fly fast to a location, to come at the scanned ship from its blind side. Evasion
            {' '}
            <Parameter name="evasion" />
            %.
        </>,
        image: <ExampleIcon />,
    },
    eureka: {
        name: 'Eureka',
        description: <>
            Spend
            {' '}
            <Parameter name="insightCost" />
            {' '}
            Insight: find a vulnerability on the system being scanned.
        </>,
        image: <ExampleIcon />,
    },
    predictiveModel: {
        name: 'Predictive Model',
        description: <>
            Spend
            {' '}
            <Parameter name="insightCost" />
            {' '}
            Insight: the scanned ship's shots are
            {' '}
            <Parameter name="accuracyReduction" />
            % less accurate for
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds.
        </>,
        image: <ExampleIcon />,
    },
    catalyse: {
        name: 'Catalyse',
        description: <>
            Remove every particle effect from the system being scanned. It takes
            {' '}
            <Parameter name="damagePerEffect" />
            {' '}
            damage for each one removed.
        </>,
        image: <ExampleIcon />,
    },
    halfLife: {
        name: 'Half-life',
        description: <>
            For
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds, particle effects on the system being scanned don't run down.
        </>,
        image: <ExampleIcon />,
    },
    crossReaction: {
        name: 'Cross-reaction',
        description: <>
            If the system being scanned has
            {' '}
            <Parameter name="effectsNeeded" />
            {' '}
            different particle effects, it loses all its power for
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds.
        </>,
        image: <ExampleIcon />,
    },
    saturate: {
        name: 'Saturate',
        description: <>
            Multiply the level of the strongest particle effect on the system being scanned by
            {' '}
            <Parameter name="multiplier" />
            .
        </>,
        image: <ExampleIcon />,
    },
});
