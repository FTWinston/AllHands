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
});
