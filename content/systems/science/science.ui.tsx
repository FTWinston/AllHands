import { EffectLevel } from 'common-ui/components/EffectLevelContext';
import { defineUiContent } from 'common-ui/content/UiContent';
import { Parameter } from 'common-ui/features/cards/components/Parameter';
import { Trait } from 'common-ui/features/cards/components/Trait';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { scienceShared } from './science.shared';

export const scienceUi = defineUiContent({
    shared: scienceShared,
    cards: {
        exampleNoTarget: {
            name: 'Some Card with a title that\'s really quite long',
            description: 'A card that has a particular effect, for a particular crew role.',
            image: <ExampleIcon />,
        },
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
    },
    effects: {
        antiprotonResidue: {
            name: 'Antiproton Residue',
            description: <>
                Enemy sensors have accumulated antiprotons on this system, increasing its damage taken from all sources by
                {' '}
                <EffectLevel />
                %.
            </>,
            image: ExampleIcon,
        },
        chronitonSaturation: {
            name: 'Chroniton Saturation',
            description: <>
                Saturated by chroniton particles from enemy sensors, this system fails every other attempt to generate a card.
            </>,
            image: ExampleIcon,
        },
        polaronBombardment: {
            name: 'Polaron Bombardment',
            description: <>
                Enemy sensors have bombarded this system with polarons, reducing its available power by
                {' '}
                <EffectLevel />
                .
            </>,
            image: ExampleIcon,
        },
        polaronAccumulation: {
            name: 'Polaron Accumulation',
            description: <>
                Increase this system's available power by 1.
            </>,
            image: ExampleIcon,
        },
        tetryonSaturation: {
            name: 'Tetryon Saturation',
            description: <>
                Saturated by tetryon particles from enemy sensors, this system is
                {' '}
                <EffectLevel />
                % more likely to be hit by attacks.
            </>,
            image: ExampleIcon,
        },
        reducedCardCost: {
            name: 'Reduced Card Cost',
            description: <>
                The cost of playing the next card is reduced by 1.
            </>,
            image: ExampleIcon,
        },
    },
});
