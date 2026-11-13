import { EffectLevel } from 'common-ui/components/EffectLevelContext';
import { defineUiContent } from 'common-ui/content/UiContent';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { effectsShared } from './effects.shared';

export const effectsUi = defineUiContent({
    shared: effectsShared,
    effects: {
        shieldScrambled: {
            name: 'Shields Scrambled',
            description: <>
                The shields have been scrambled, so the next
                {' '}
                <EffectLevel />
                {' '}
                hull cards that would tune them don't.
            </>,
            image: ExampleIcon,
        },
        damagedCard: {
            name: 'Damaged Card',
            description: <>The next card due to be drawn is damaged.</>,
            image: ExampleIcon,
        },
        disruptGeneration: {
            name: 'Disrupted',
            description: <>
                This system is being disrupted, and will not generate for the next
                {' '}
                <EffectLevel />
                {' '}
                attempts.
            </>,
            image: ExampleIcon,
        },
        feedback: {
            name: 'Feedback',
            description: <>
                This system will take
                {' '}
                <EffectLevel />
                {' '}
                damage every time it generates.
            </>,
            image: ExampleIcon,
        },
        reactorBreach: {
            name: 'Reactor Breach',
            description: <>The reactor has breached. The ship will be destroyed.</>,
            image: ExampleIcon,
        },
    },
});
