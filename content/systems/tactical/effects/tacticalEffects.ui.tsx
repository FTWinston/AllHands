import { defineUiEffects } from 'common-ui/content/UiContent';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { effects as sharedEffects } from './tacticalEffects.shared';

export const effects = defineUiEffects(sharedEffects, {
    flareBurning: {
        name: 'Flare Burning',
        description: <>A flare launched from this ship is burning, dazzling sensors nearby.</>,
        image: ExampleIcon,
    },
});
