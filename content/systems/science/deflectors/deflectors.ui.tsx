import { defineUiContent } from 'common-ui/content/UiContent';
import { Trait } from 'common-ui/features/cards/components/Trait';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { deflectorsShared } from './deflectors.shared';

export const deflectorsUi = defineUiContent({
    shared: deflectorsShared,
    cards: {
        deflectorPhasedAntiprotonBeam: {
            name: 'Phased Antiproton Beam',
            description: <>
                <Trait trait="expendable" />
                Emits a long range beam of phased antiprotons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedAntiprotonPulse: {
            name: 'Phased Antiproton Pulse',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a pulse of phased antiprotons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedAntiprotonBurst: {
            name: 'Phased Antiproton Burst',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a burst of phased antiprotons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedAntiprotonField: {
            name: 'Phased Antiproton Field',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a wave of phased antiprotons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedTetryonBeam: {
            name: 'Phased Tetryon Beam',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a long range beam of phased tetryons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedTetryonPulse: {
            name: 'Phased Tetryon Pulse',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a pulse of phased tetryons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedTetryonBurst: {
            name: 'Phased Tetryon Burst',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a burst of phased tetryons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedTetryonField: {
            name: 'Phased Tetryon Field',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a wave of phased tetryons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedChronitonBeam: {
            name: 'Phased Chroniton Beam',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a long range beam of phased chronitons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedChronitonPulse: {
            name: 'Phased Chroniton Pulse',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a pulse of phased chronitons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedChronitonBurst: {
            name: 'Phased Chroniton Burst',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a burst of phased chronitons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedChronitonField: {
            name: 'Phased Chroniton Field',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a wave of phased chronitons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedGravitonBeam: {
            name: 'Phased Graviton Beam',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a long range beam of phased gravitons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedGravitonPulse: {
            name: 'Phased Graviton Pulse',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a pulse of phased gravitons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedGravitonBurst: {
            name: 'Phased Graviton Burst',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a burst of phased gravitons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedGravitonField: {
            name: 'Phased Graviton Field',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a wave of phased gravitons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedPolaronBeam: {
            name: 'Phased Polaron Beam',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a long range beam of phased polarons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedPolaronPulse: {
            name: 'Phased Polaron Pulse',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a pulse of phased polarons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedPolaronBurst: {
            name: 'Phased Polaron Burst',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a burst of phased polarons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedPolaronField: {
            name: 'Phased Polaron Field',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a wave of phased polarons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentAntiprotonBeam: {
            name: 'Coherent Antiproton Beam',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a long range beam of coherent antiprotons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentAntiprotonPulse: {
            name: 'Coherent Antiproton Pulse',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a pulse of coherent antiprotons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentAntiprotonBurst: {
            name: 'Coherent Antiproton Burst',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a burst of coherent antiprotons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentAntiprotonField: {
            name: 'Coherent Antiproton Field',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a wave of coherent antiprotons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentTetryonBeam: {
            name: 'Coherent Tetryon Beam',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a long range beam of coherent tetryons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentTetryonPulse: {
            name: 'Coherent Tetryon Pulse',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a pulse of coherent tetryons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentTetryonBurst: {
            name: 'Coherent Tetryon Burst',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a burst of coherent tetryons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentTetryonField: {
            name: 'Coherent Tetryon Field',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a wave of coherent tetryons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentChronitonBeam: {
            name: 'Coherent Chroniton Beam',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a long range beam of coherent chronitons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentChronitonPulse: {
            name: 'Coherent Chroniton Pulse',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a pulse of coherent chronitons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentChronitonBurst: {
            name: 'Coherent Chroniton Burst',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a burst of coherent chronitons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentChronitonField: {
            name: 'Coherent Chroniton Field',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a wave of coherent chronitons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentGravitonBeam: {
            name: 'Coherent Graviton Beam',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a long range beam of coherent gravitons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentGravitonPulse: {
            name: 'Coherent Graviton Pulse',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a pulse of coherent gravitons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentGravitonBurst: {
            name: 'Coherent Graviton Burst',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a burst of coherent gravitons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentGravitonField: {
            name: 'Coherent Graviton Field',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a wave of coherent gravitons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentPolaronBeam: {
            name: 'Coherent Polaron Beam',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a long range beam of coherent polarons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentPolaronPulse: {
            name: 'Coherent Polaron Pulse',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a pulse of coherent polarons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentPolaronBurst: {
            name: 'Coherent Polaron Burst',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a burst of coherent polarons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentPolaronField: {
            name: 'Coherent Polaron Field',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a wave of coherent polarons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedAntiprotonBeam: {
            name: 'Inverted Antiproton Beam',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a long range beam of inverted antiprotons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedAntiprotonPulse: {
            name: 'Inverted Antiproton Pulse',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a pulse of inverted antiprotons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedAntiprotonBurst: {
            name: 'Inverted Antiproton Burst',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a burst of inverted antiprotons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedAntiprotonField: {
            name: 'Inverted Antiproton Field',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a wave of inverted antiprotons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedTetryonBeam: {
            name: 'Inverted Tetryon Beam',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a long range beam of inverted tetryons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedTetryonPulse: {
            name: 'Inverted Tetryon Pulse',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a pulse of inverted tetryons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedTetryonBurst: {
            name: 'Inverted Tetryon Burst',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a burst of inverted tetryons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedTetryonField: {
            name: 'Inverted Tetryon Field',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a wave of inverted tetryons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedChronitonBeam: {
            name: 'Inverted Chroniton Beam',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a long range beam of inverted chronitons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedChronitonPulse: {
            name: 'Inverted Chroniton Pulse',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a pulse of inverted chronitons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedChronitonBurst: {
            name: 'Inverted Chroniton Burst',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a burst of inverted chronitons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedChronitonField: {
            name: 'Inverted Chroniton Field',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a wave of inverted chronitons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedGravitonBeam: {
            name: 'Inverted Graviton Beam',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a long range beam of inverted gravitons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedGravitonPulse: {
            name: 'Inverted Graviton Pulse',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a pulse of inverted gravitons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedGravitonBurst: {
            name: 'Inverted Graviton Burst',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a burst of inverted gravitons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedGravitonField: {
            name: 'Inverted Graviton Field',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a wave of inverted gravitons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedPolaronBeam: {
            name: 'Inverted Polaron Beam',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a long range beam of inverted polarons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedPolaronPulse: {
            name: 'Inverted Polaron Pulse',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a pulse of inverted polarons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedPolaronBurst: {
            name: 'Inverted Polaron Burst',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a burst of inverted polarons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedPolaronField: {
            name: 'Inverted Polaron Field',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a wave of inverted polarons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedAntiprotonBeam: {
            name: 'Modulated Antiproton Beam',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a long range beam of modulated antiprotons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedAntiprotonPulse: {
            name: 'Modulated Antiproton Pulse',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a pulse of modulated antiprotons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedAntiprotonBurst: {
            name: 'Modulated Antiproton Burst',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a burst of modulated antiprotons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedAntiprotonField: {
            name: 'Modulated Antiproton Field',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a wave of modulated antiprotons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedTetryonBeam: {
            name: 'Modulated Tetryon Beam',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a long range beam of modulated tetryons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedTetryonPulse: {
            name: 'Modulated Tetryon Pulse',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a pulse of modulated tetryons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedTetryonBurst: {
            name: 'Modulated Tetryon Burst',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a burst of modulated tetryons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedTetryonField: {
            name: 'Modulated Tetryon Field',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a wave of modulated tetryons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedChronitonBeam: {
            name: 'Modulated Chroniton Beam',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a long range beam of modulated chronitons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedChronitonPulse: {
            name: 'Modulated Chroniton Pulse',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a pulse of modulated chronitons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedChronitonBurst: {
            name: 'Modulated Chroniton Burst',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a burst of modulated chronitons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedChronitonField: {
            name: 'Modulated Chroniton Field',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a wave of modulated chronitons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedGravitonBeam: {
            name: 'Modulated Graviton Beam',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a long range beam of modulated gravitons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedGravitonPulse: {
            name: 'Modulated Graviton Pulse',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a pulse of modulated gravitons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedGravitonBurst: {
            name: 'Modulated Graviton Burst',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a burst of modulated gravitons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedGravitonField: {
            name: 'Modulated Graviton Field',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a wave of modulated gravitons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedPolaronBeam: {
            name: 'Modulated Polaron Beam',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a long range beam of modulated polarons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedPolaronPulse: {
            name: 'Modulated Polaron Pulse',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a pulse of modulated polarons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedPolaronBurst: {
            name: 'Modulated Polaron Burst',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a burst of modulated polarons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedPolaronField: {
            name: 'Modulated Polaron Field',
            description: <>
                <Trait trait="expendable" />
                {' '}
                Emits a wave of modulated polarons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
    },
});
