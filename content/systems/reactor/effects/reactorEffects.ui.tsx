import { EffectLevel } from 'common-ui/components/EffectLevelContext';
import { defineUiEffects } from 'common-ui/content/UiContent';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { effects as sharedEffects } from './reactorEffects.shared';

export const effects = defineUiEffects(sharedEffects, {
    reducedPower: {
        name: 'Reduced Power',
        description: <>
            Reactor damage has decreased the power available to this systemby
            {' '}
            <EffectLevel />
            .
        </>,
        image: ExampleIcon,
    },
});
