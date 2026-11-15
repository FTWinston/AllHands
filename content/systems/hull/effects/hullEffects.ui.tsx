import { tunedReductionPercent, reinforcedDrainPercent } from 'common-data/features/ships/utils/shieldStats';
import { defineUiEffects } from 'common-ui/content/UiContent';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { effects as sharedEffects } from './hullEffects.shared';

export const effects = defineUiEffects(sharedEffects, {
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
});
