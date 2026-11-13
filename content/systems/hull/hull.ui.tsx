import { tunedReductionPercent, reinforcedDrainPercent } from 'common-data/features/ships/utils/shieldStats';
import { defineUiContent } from 'common-ui/content/UiContent';
import { Parameter } from 'common-ui/features/cards/components/Parameter';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { shieldTuningDuration, hullShared } from './hull.shared';

/** How long a hull card's shield tuning lasts. Every tuning lasts the same time. */
const shieldTuningSeconds = shieldTuningDuration / 1000;

export const hullUi = defineUiContent({
    shared: hullShared,
    cards: {
        hullBare: {
            name: 'Bare Hull',
            description: 'Adds nothing to the shields, and leaves their tuning as it is when played.',
            image: <ExampleIcon />,
        },
        hullShieldEmitter: {
            name: 'Shield Emitter',
            description: <>
                While undamaged, adds
                {' '}
                <Parameter name="shieldCapacity" />
                {' '}
                to the shields' capacity.
                {` When played, reinforces the shields for ${shieldTuningSeconds} seconds, so they drain less.`}
            </>,
            image: <ExampleIcon />,
        },
        hullVolatileEmitter: {
            name: 'Volatile Emitter',
            description: <>
                While undamaged, adds
                {' '}
                <Parameter name="shieldCapacity" />
                {' '}
                to the shields' capacity.
                {` When played, reinforces the shields for ${shieldTuningSeconds} seconds. All are damaged if one is, or if the shields collapse.`}
            </>,
            image: <ExampleIcon />,
        },
        hullShieldTuningEnergy: {
            name: 'Energy Tuning',
            description: `When played, tunes the shields for ${shieldTuningSeconds} seconds, so energy weapon hits do ${tunedReductionPercent}% less damage.`,
            image: <ExampleIcon />,
        },
        hullShieldTuningTorpedo: {
            name: 'Torpedo Tuning',
            description: `When played, tunes the shields for ${shieldTuningSeconds} seconds, so torpedo hits do ${tunedReductionPercent}% less damage.`,
            image: <ExampleIcon />,
        },
    },
    effects: {
        shieldReinforced: {
            name: 'Reinforced',
            description: <>{`A shield tuning: the shields are drained ${100 - reinforcedDrainPercent}% less by the damage they absorb. Set by playing a shield emitter, until it runs out or another tuning replaces it.`}</>,
            image: ExampleIcon,
        },
        shieldTunedEnergy: {
            name: 'Tuned: Energy',
            description: <>{`A shield tuning: hits from energy weapons do ${tunedReductionPercent}% less damage. Set by playing an energy tuning card, until it runs out or another tuning replaces it.`}</>,
            image: ExampleIcon,
        },
        shieldTunedTorpedo: {
            name: 'Tuned: Torpedoes',
            description: <>{`A shield tuning: torpedo hits do ${tunedReductionPercent}% less damage. Set by playing a torpedo tuning card, until it runs out or another tuning replaces it.`}</>,
            image: ExampleIcon,
        },
    },
});
