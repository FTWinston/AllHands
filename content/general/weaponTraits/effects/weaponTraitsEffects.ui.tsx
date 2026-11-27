import { EffectLevel } from 'common-ui/components/EffectLevelContext';
import { defineUiEffects } from 'common-ui/content/UiContent';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { effects as sharedEffects } from './weaponTraitsEffects.shared';

export const effects = defineUiEffects(sharedEffects, {
    persistentDamage: {
        name: 'Burning',
        description: <>
            A weapon hit has left this system burning. It takes
            {' '}
            <EffectLevel />
            {' '}
            damage every few seconds until the fire goes out.
        </>,
        image: ExampleIcon,
    },
    powerDrain: {
        name: 'Power Drain',
        description: <>
            A weapon hit is draining this system's power, reducing it by
            {' '}
            <EffectLevel />
            {' '}
            for a while.
        </>,
        image: ExampleIcon,
    },
    systemDisabled: {
        name: 'Disabled',
        description: <>A weapon hit has disabled this system. None of its cards can be played for a while.</>,
        image: ExampleIcon,
    },
});
