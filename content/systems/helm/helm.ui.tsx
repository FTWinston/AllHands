import { defineUiContent } from 'common-ui/content/UiContent';
import { Trait } from 'common-ui/features/cards/components/Trait';
import { WarpAwayIcon } from 'common-ui/icons/cards/WarpAway';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { helmShared } from './helm.shared';

export const helmUi = defineUiContent({
    shared: helmShared,
    cards: {
        warpAway: {
            name: 'Warp Away',
            description: <>
                <Trait trait="priority" />
                {' '}
                Leave the area and return to the sector map.
            </>,
            image: <WarpAwayIcon />,
        },
        slowAndSteady: {
            name: 'Slow & Steady',
            description: <>
                <Trait trait="primary" />
                {' '}
                Turn towards a target then move towards it at a steady pace.
            </>,
            image: <ExampleIcon />,
        },
        fullReverse: {
            name: 'Full Reverse',
            description: 'Turn away from the target then reverse slowly towards it.',
            image: <ExampleIcon />,
        },
        zigZag: {
            name: 'Zig-zag',
            description: 'Move from side to side while advancing towards a target, facing it the whole time.',
            image: <ExampleIcon />,
        },
        strafe: {
            name: 'Strafe',
            description: 'Slowly move a short distance without rotating at all.',
            image: <ExampleIcon />,
        },
        sweep: {
            name: 'Sweep',
            description: 'Curve towards the destination, turning through 90 degrees during the movement.',
            image: <ExampleIcon />,
        },
        sweepLeft: {
            name: 'Sweep Left',
            description: 'Curve left towards the destination, turning through 90 degrees during the movement.',
            image: <ExampleIcon />,
        },
        sweepRight: {
            name: 'Sweep Right',
            description: 'Curve right towards the destination, turning through 90 degrees during the movement.',
            image: <ExampleIcon />,
        },
        faceTarget: {
            name: 'Face Target',
            description: 'Rotate to face the selected location without moving.',
            image: <ExampleIcon />,
        },
    },
});
