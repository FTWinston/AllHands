import { defineUiEffects } from 'common-ui/content/UiContent';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { effects as sharedEffects } from './quarantineGateEffects.shared';

export const effects = defineUiEffects(sharedEffects, {
    keyPower: {
        name: 'Key Power',
        description: <>This system is running a level higher for a while, enough to turn its Shutdown Key.</>,
        image: ExampleIcon,
    },
    gatePulse: {
        name: 'Gate Pulse',
        description: <>A pulse from the quarantine gate has passed through this system. It does no harm.</>,
        image: ExampleIcon,
    },
    keyTurned: {
        name: 'Key Turned',
        description: <>This station's Shutdown Key is turned. It turns back on its own.</>,
        image: ExampleIcon,
    },
});
