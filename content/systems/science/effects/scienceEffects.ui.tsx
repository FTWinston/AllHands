import { EffectLevel } from 'common-ui/components/EffectLevelContext';
import { defineUiEffects } from 'common-ui/content/UiContent';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { effects as sharedEffects } from './scienceEffects.shared';

export const effects = defineUiEffects(sharedEffects, {
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
    insight: {
        name: 'Insight',
        description: <>
            Science has learned
            {' '}
            <EffectLevel />
            {' '}
            Insight from its scans, which some of its cards spend. Revealing a system or reading a hand gains 1, and finding a vulnerability gains 2, up to 5.
        </>,
        image: ExampleIcon,
    },
    predictiveModel: {
        name: 'Predictive Model',
        description: <>
            Enemy sensors are predicting this ship's fire: its shots are
            {' '}
            <EffectLevel />
            % less accurate.
        </>,
        image: ExampleIcon,
    },
    gravitonDrag: {
        name: 'Graviton Drag',
        description: <>
            Gravitons from enemy sensors are dragging on this ship: manoeuvres it starts are
            {' '}
            <EffectLevel />
            % slower.
        </>,
        image: ExampleIcon,
    },
    halfLife: {
        name: 'Half-life',
        description: <>
            Enemy sensors are holding this system's particles in place: its particle effects don't run down.
        </>,
        image: ExampleIcon,
    },
    crossReaction: {
        name: 'Cross-reaction',
        description: <>
            The particles on this system are reacting with each other: it has no power.
        </>,
        image: ExampleIcon,
    },
});
