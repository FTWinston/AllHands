import { defineUiCards } from 'common-ui/content/UiContent';
import { Parameter } from 'common-ui/features/cards/components/Parameter';
import { Trait } from 'common-ui/features/cards/components/Trait';
import { WarpAwayIcon } from 'common-ui/icons/cards/WarpAway';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { cards as sharedCards } from './helmCards.shared';

export const cards = defineUiCards(sharedCards, {
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
            Turn towards a point then move towards it at a steady pace.
        </>,
        image: <ExampleIcon />,
    },
    slowReverse: {
        name: 'Slow Reverse',
        description: 'Turn away from a point then reverse slowly towards it.',
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
        description: 'Curve towards a point, turning through 90 degrees during the movement.',
        image: <ExampleIcon />,
    },
    sweepLeft: {
        name: 'Sweep Left',
        description: 'Curve left towards a point, turning through 90 degrees during the movement.',
        image: <ExampleIcon />,
    },
    sweepRight: {
        name: 'Sweep Right',
        description: 'Curve right towards a point, turning through 90 degrees during the movement.',
        image: <ExampleIcon />,
    },
    faceTarget: {
        name: 'Face Target',
        description: 'Rotate to face the selected point without moving.',
        image: <ExampleIcon />,
    },
    burn: {
        name: 'Burn',
        description: <>
            Turn towards a target then race straight to it. Gain
            {' '}
            <Parameter name="momentum" />
            {' '}
            Momentum.
        </>,
        image: <ExampleIcon />,
    },
    fullImpulse: {
        name: 'Full Impulse',
        description: <>
            Turn towards a point then fly straight to it,
            {' '}
            <Parameter name="speedPerMomentum" />
            % faster and
            {' '}
            <Parameter name="evasionPerMomentum" />
            % harder to hit for each level of Momentum. Spends half of it.
        </>,
        image: <ExampleIcon />,
    },
    evasivePattern: {
        name: 'Evasive Pattern',
        description: <>
            Jink in place for
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds. The ship is hard to hit, but its weapons are
            {' '}
            <Parameter name="accuracyLoss" />
            % less accurate.
        </>,
        image: <ExampleIcon />,
    },
    broadside: {
        name: 'Broadside',
        description: 'Move slowly to the destination, turning side-on to the direction of travel on the way.',
        image: <ExampleIcon />,
    },
    broadsideLeft: {
        name: 'Broadside Left',
        description: 'Move slowly to the destination, turning 90 degrees left of the direction of travel on the way.',
        image: <ExampleIcon />,
    },
    broadsideRight: {
        name: 'Broadside Right',
        description: 'Move slowly to the destination, turning 90 degrees right of the direction of travel on the way.',
        image: <ExampleIcon />,
    },
    slingshot: {
        name: 'Slingshot',
        description: <>
            Curve quickly to the destination, turning through 180 degrees during the movement. Gain
            {' '}
            <Parameter name="momentum" />
            {' '}
            Momentum.
        </>,
        image: <ExampleIcon />,
    },
    slingshotLeft: {
        name: 'Slingshot Left',
        description: <>
            Curve left quickly to the destination, turning through 180 degrees during the movement. Gain
            {' '}
            <Parameter name="momentum" />
            {' '}
            Momentum.
        </>,
        image: <ExampleIcon />,
    },
    slingshotRight: {
        name: 'Slingshot Right',
        description: <>
            Curve right quickly to the destination, turning through 180 degrees during the movement. Gain
            {' '}
            <Parameter name="momentum" />
            {' '}
            Momentum.
        </>,
        image: <ExampleIcon />,
    },
    lockOn: {
        name: 'Lock On',
        description: <>
            Stop the ship, then keep turning to face the target ship for
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds. The ship's weapons are
            {' '}
            <Parameter name="accuracy" />
            % more accurate while it does.
        </>,
        image: <ExampleIcon />,
    },
    orbit: {
        name: 'Orbit',
        description: <>
            For
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds, circle the target ship at the current range, keeping one side to it. Gain
            {' '}
            <Parameter name="momentum" />
            {' '}
            Momentum for every
            {' '}
            <Parameter name="momentumInterval" />
            {' '}
            seconds spent circling.
        </>,
        image: <ExampleIcon />,
    },
    circleStrafe: {
        name: 'Circle Strafe',
        description: <>
            For
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds, circle the target ship at the current range, always facing it.
        </>,
        image: <ExampleIcon />,
    },
    interpose: {
        name: 'Interpose',
        description: <>
            For
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds, hold the point between the target ship and the hostile ship closest to it.
        </>,
        image: <ExampleIcon />,
    },
    shadow: {
        name: 'Shadow',
        description: <>
            For
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds, keep close behind the target ship, in its rear arc.
        </>,
        image: <ExampleIcon />,
    },
    breakAway: {
        name: 'Break Away',
        description: <>
            Turn away from the target ship then burn
            {' '}
            <Parameter name="distance" />
            {' '}
            units directly away from it. Gain
            {' '}
            <Parameter name="momentum" />
            {' '}
            Momentum.
        </>,
        image: <ExampleIcon />,
    },
    attackRun: {
        name: 'Attack Run',
        description: <>
            Turn towards the target ship then race straight at it, stopping close by, for
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds. Tactical has
            {' '}
            <Parameter name="power" />
            {' '}
            more power while it lasts.
        </>,
        image: <ExampleIcon />,
    },
});
