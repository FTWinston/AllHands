import { defineUiEffects } from 'common-ui/content/UiContent';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { effects as sharedEffects } from './standingOrdersEffects.shared';

export const effects = defineUiEffects(sharedEffects, {
    phasedPing: {
        name: 'Phased Ping',
        description: <>Something has pinged this system with a phased signal. It does no harm.</>,
        image: ExampleIcon,
    },
    coherentPing: {
        name: 'Coherent Ping',
        description: <>Something has pinged this system with a coherent signal. It does no harm.</>,
        image: ExampleIcon,
    },
    invertedPing: {
        name: 'Inverted Ping',
        description: <>Something has pinged this system with an inverted signal. It does no harm.</>,
        image: ExampleIcon,
    },
});
