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
    backAway: {
        name: 'Back Away',
        description: 'Turn away from a point then reverse slowly towards it.',
        image: <ExampleIcon />,
    },
    zigZag: {
        name: 'Zig-zag',
        description: 'Weave widely from side to side while advancing towards a point, facing it the whole time. Longer moves zig and zag more.',
        image: <ExampleIcon />,
    },
    sharpTurn: {
        name: 'Sharp Turn',
        description: 'Carry straight on the way the ship is facing, without turning first, then turn hard towards a point and fly straight to it.',
        image: <ExampleIcon />,
    },
    strafe: {
        name: 'Strafe',
        description: 'Slowly move a short distance without rotating at all.',
        image: <ExampleIcon />,
    },
    sweep: {
        name: 'Sweep',
        description: 'Curve towards a point, turning early on and finishing with a short straight run.',
        image: <ExampleIcon />,
    },
    sweepLeft: {
        name: 'Sweep Left',
        description: 'Curve left towards a point, turning early on and finishing with a short straight run.',
        image: <ExampleIcon />,
    },
    sweepRight: {
        name: 'Sweep Right',
        description: 'Curve right towards a point, turning early on and finishing with a short straight run.',
        image: <ExampleIcon />,
    },
    pivot: {
        name: 'Pivot',
        description: 'Turn on the spot to face the selected point.',
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
    punchIt: {
        name: 'Punch It',
        description: <>
            Race to a point ahead of the ship, turning as it goes. For each level of Momentum, it's
            {' '}
            <Parameter name="speedPerMomentum" />
            % faster and has
            {' '}
            <Parameter name="evasionPerMomentum" />
            {' '}
            more evasion. Spends half of it.
        </>,
        image: <ExampleIcon />,
    },
    overdrive: {
        name: 'Overdrive',
        description: <>
            Push the engines past their limit: turn towards a point then race to it, faster than any other maneuver. Puts
            {' '}
            <Parameter name="flux" />
            {' '}
            Flux on the helm system.
        </>,
        image: <ExampleIcon />,
    },
    hairpin: {
        name: 'Hairpin',
        description: <>
            Whip round through a tight half circle, away from the nearest hostile ship, then fly
            {' '}
            <Parameter name="distance" />
            {' '}
            units back the way the ship was facing. Spends all its Momentum: for each level, it flies back
            {' '}
            <Parameter name="distancePerMomentum" />
            {' '}
            more units, and has
            {' '}
            <Parameter name="evasionPerMomentum" />
            {' '}
            more evasion.
        </>,
        image: <ExampleIcon />,
    },
    juke: {
        name: 'Juke',
        description: <>
            Spend
            {' '}
            <Parameter name="momentumCost" />
            {' '}
            Momentum to sidestep
            {' '}
            <Parameter name="distance" />
            {' '}
            units, away from the nearest hostile ship. Every ship aiming at this one loses its aim: Lock on it is dropped, and weapons that hold aim start over.
        </>,
        image: <ExampleIcon />,
    },
    drift: {
        name: 'Drift',
        description: <>
            Cut the engines and slide on the way the ship is going, turning to face the selected point.
            Needs Momentum, which it all spends: it slides
            {' '}
            <Parameter name="distancePerMomentum" />
            {' '}
            units, and has
            {' '}
            <Parameter name="evasionPerMomentum" />
            {' '}
            more evasion, for each level.
        </>,
        image: <ExampleIcon />,
    },
    evasiveManeuvers: {
        name: 'Evasive Maneuvers',
        description: <>
            Fly a fixed pattern of turns for
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
    patternAlpha: {
        name: 'Pattern Alpha',
        description: <>
            Weave: swerve right, cut hard left, and again, then a last swerve right. Ends about 12 units ahead, facing the way it started. Harder to hit, but the ship's weapons are
            {' '}
            <Parameter name="accuracyLoss" />
            % less accurate.
        </>,
        image: <ExampleIcon />,
    },
    patternBeta: {
        name: 'Pattern Beta',
        description: <>
            Break hard to starboard, jinking back ahead twice on the way. Ends about 10 units to the right and 4 ahead, facing right. Harder to hit, but the ship's weapons are
            {' '}
            <Parameter name="accuracyLoss" />
            % less accurate.
        </>,
        image: <ExampleIcon />,
    },
    patternGamma: {
        name: 'Pattern Gamma',
        description: <>
            Jink right then left, then hook round to port. Ends about 5 units to the left and 3 ahead, facing back the way it came. Harder to hit, but the ship's weapons are
            {' '}
            <Parameter name="accuracyLoss" />
            % less accurate.
        </>,
        image: <ExampleIcon />,
    },
    broadside: {
        name: 'Broadside',
        description: 'Turn towards the destination and move briskly to it, turning side-on towards the closest hostile ship half way there, then straightening up again.',
        image: <ExampleIcon />,
    },
    slingshot: {
        name: 'Slingshot',
        description: <>
            Fly at the closest hostile ship, swing round its far side, and out to a point. Gain
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
            seconds, hold the point between the target ship and the hostile ship closest to it, blocking shots at the target ship that pass through.
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
            seconds, keep close behind the target ship, in its rear arc. While you are within
            {' '}
            <Parameter name="rearArc" />
            {' '}
            degrees of straight behind it, its evasion doesn't count against your weapons.
        </>,
        image: <ExampleIcon />,
    },
    attackRun: {
        name: 'Attack Run',
        description: <>
            Make a pass at the target ship, facing it all the way: fly in alongside it, then round behind it, for
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
