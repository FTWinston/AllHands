import { EffectLevel } from 'common-ui/components/EffectLevelContext';
import { defineUiEffects } from 'common-ui/content/UiContent';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { effects as sharedEffects, momentumDecayInterval, momentumEvasionPerLevel, momentumSpeedPerLevel, overdriveFlux, overdriveMomentum } from './helmEffects.shared';

export const effects = defineUiEffects(sharedEffects, {
    momentum: {
        name: 'Momentum',
        description: <>
            {`Each level makes every maneuver ${momentumSpeedPerLevel}% faster, and the ship ${momentumEvasionPerLevel}% harder to hit. Starting a maneuver just after finishing one adds a level. A hit on the ship takes one away, and sitting still loses one every ${momentumDecayInterval / 1000}s, drawing a card. Currently at level `}
            <EffectLevel />
            .
        </>,
        image: ExampleIcon,
    },
    holdingSteady: {
        name: 'Holding Steady',
        description: <>
            The ship is holding still, aimed at its target, making its weapons
            {' '}
            <EffectLevel />
            % more accurate.
        </>,
        image: ExampleIcon,
    },
    jinking: {
        name: 'Jinking',
        description: <>
            The ship is flying evasive maneuvers, making its weapons
            {' '}
            <EffectLevel />
            % less accurate.
        </>,
        image: ExampleIcon,
    },
    shadowing: {
        name: 'Shadowing',
        description: <>The ship is shadowing another. While it stays behind that ship, in its rear arc, the ship&apos;s weapons ignore that ship&apos;s evasion.</>,
        image: ExampleIcon,
    },
    attackRun: {
        name: 'Attack Run',
        description: <>
            The ship is on an attack run: tactical has
            {' '}
            <EffectLevel />
            {' '}
            more power.
        </>,
        image: ExampleIcon,
    },
    screened: {
        name: 'Screened',
        description: <>Another ship is interposing for this one. Hostile shots at it are taken by that ship instead, if it's in the way.</>,
        image: ExampleIcon,
    },
    overdrive: {
        name: 'Overdrive',
        description: <>{`The engines are pushed past their limit. Each maneuver started gains ${overdriveMomentum} more Momentum, and puts ${overdriveFlux} Flux on the helm system.`}</>,
        image: ExampleIcon,
    },
});
