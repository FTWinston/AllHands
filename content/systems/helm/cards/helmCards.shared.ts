import { defineCards } from 'common-data/content/SharedContent';
import { CardMotionSegmentFacing } from 'common-data/features/cards/types/CardDefinition';
import { evasivePatternDuration } from 'common-data/features/cards/utils/evasivePatterns';
import { lockOnDuration } from 'content/systems/helm/effects/helmEffects.shared';

/** How much harder to hit a ship flying one of the evasive maneuver patterns is, and how much less accurate its own weapons are, in percentage points. */
const evasivePatternEvasion = 40;
const evasivePatternAccuracyLoss = 25;

export const cards = defineCards({
    slowAndSteady: {
        targetType: 'location',
        system: 'helm',
        traits: ['primary'],
        // Rotate to face target first, then move straight towards it
        startFacing: CardMotionSegmentFacing.FinalVector,
        endFacing: CardMotionSegmentFacing.FinalVector,
        baseRotationSpeed: 0.75,
        baseSpeed: 0.75,
        parameters: { cost: 1, evasion: 0 },
    },
    backAway: {
        targetType: 'location',
        system: 'helm',
        // Rotate to face away from target, then reverse towards it
        startFacing: CardMotionSegmentFacing.FinalVector,
        startFacingOffset: Math.PI,
        endFacing: CardMotionSegmentFacing.FinalVector,
        endFacingOffset: Math.PI,
        baseRotationSpeed: 0.75,
        baseSpeed: 0.5,
        parameters: { cost: 2, evasion: 0 },
    },
    zigZag: {
        targetType: 'location',
        system: 'helm',
        // Rotate to face target first, then zig-zag towards it, facing it the whole way
        startFacing: CardMotionSegmentFacing.FinalVector,
        endFacing: CardMotionSegmentFacing.FinalVector,
        baseRotationSpeed: 1.25,
        // Fast along the weave, as the path is over three times as long as the distance it covers
        baseSpeed: 2.5,
        // Fixed legs and width, so a longer move has more legs rather than a wider path
        path: { shape: 'zigZag', legLength: 1.6, width: 2.5 },
        minDistance: 4.5,
        parameters: { cost: 2, evasion: 25 },
    },
    sharpTurn: {
        targetType: 'location',
        system: 'helm',
        // Carry straight on the way the ship faces, without turning on the spot first, then turn hard onto the target and fly straight to it
        path: { shape: 'sharpTurn', lead: 3, radius: 0.75 },
        baseRotationSpeed: 1.25,
        baseSpeed: 1.5,
        minDistance: 3,
        parameters: { cost: 2, evasion: 30 },
    },
    strafe: {
        targetType: 'location',
        system: 'helm',
        // Don't rotate before moving, keep current heading throughout
        baseRotationSpeed: 1,
        baseSpeed: 0.4,
        maxDistance: 6,
        parameters: { cost: 1, evasion: 15 },
    },
    sweep: {
        targetType: 'choice',
        system: 'helm',
        cards: ['sweepLeft', 'sweepRight'],
        // The same as its options have: the evasion of a maneuver is read from the card that was played, which is this one
        parameters: { cost: 2, evasion: 15 },
    },
    sweepLeft: {
        targetType: 'location',
        system: 'helm',
        // Curves anticlockwise, bulging out to the right of the line to the target. Most of the turning is done early, leaving a short final leg.
        path: { shape: 'sweep', turn: 'left', startOffset: 60 * Math.PI / 180, turnAngle: 100 * Math.PI / 180, turnFraction: 0.8 },
        baseRotationSpeed: 1,
        baseSpeed: 1,
        parameters: { cost: 2, evasion: 15 },
    },
    sweepRight: {
        targetType: 'location',
        system: 'helm',
        // Curves clockwise, bulging out to the left of the line to the target. Most of the turning is done early, leaving a short final leg.
        path: { shape: 'sweep', turn: 'right', startOffset: 60 * Math.PI / 180, turnAngle: 100 * Math.PI / 180, turnFraction: 0.8 },
        baseRotationSpeed: 1,
        baseSpeed: 1,
        parameters: { cost: 2, evasion: 15 },
    },
    pivot: {
        targetType: 'location',
        system: 'helm',
        // Turn on the spot to face the target, no movement
        startFacing: CardMotionSegmentFacing.FinalVector,
        baseRotationSpeed: 1,
        baseSpeed: 0,
        parameters: { cost: 1, evasion: 0 },
    },
    burn: {
        targetType: 'location',
        system: 'helm',
        // Rotate to face target first, then move straight towards it, fast
        startFacing: CardMotionSegmentFacing.FinalVector,
        endFacing: CardMotionSegmentFacing.FinalVector,
        baseRotationSpeed: 1,
        baseSpeed: 1.5,
        minDistance: 6,
        // momentum: the levels of Momentum gained by playing it
        parameters: { cost: 2, evasion: 10, momentum: 2 },
    },
    punchIt: {
        targetType: 'location',
        rarity: 'uncommon',
        system: 'helm',
        // Race straight to a target ahead of the ship, turning as it goes rather than on the spot first
        startFacing: CardMotionSegmentFacing.FinalVector,
        endFacing: CardMotionSegmentFacing.FinalVector,
        turnWhileMoving: Math.PI / 4,
        maxBearing: Math.PI / 4,
        baseRotationSpeed: 1.5,
        baseSpeed: 2,
        minDistance: 3,
        // speedPerMomentum: percentage of extra speed for each level of Momentum held; evasionPerMomentum: extra evasion for each level
        parameters: { cost: 2, evasion: 10, speedPerMomentum: 25, evasionPerMomentum: 8 },
    },
    overdrive: {
        targetType: 'location',
        rarity: 'rare',
        system: 'helm',
        // Rotate to face target first, then race straight to it, faster than anything else, with the engines pushed past their limit
        startFacing: CardMotionSegmentFacing.FinalVector,
        endFacing: CardMotionSegmentFacing.FinalVector,
        baseRotationSpeed: 1.5,
        baseSpeed: 5,
        minDistance: 6,
        // flux: the levels of Flux put on the helm system
        parameters: { cost: 2, evasion: 15, flux: 2 },
    },
    // Hairpin's and Juke's paths are in common-data (`momentumManeuvers`), so that the helm can preview them
    hairpin: {
        targetType: 'no-target',
        rarity: 'uncommon',
        system: 'helm',
        // distance: how far the ship flies back the way it came, once turned; distancePerMomentum: how much further, for each level of Momentum it spends; evasionPerMomentum: extra evasion, while it does, for each level spent
        parameters: { cost: 2, evasion: 10, distance: 2, distancePerMomentum: 1.5, evasionPerMomentum: 8 },
    },
    juke: {
        targetType: 'no-target',
        system: 'helm',
        // momentumCost: the levels of Momentum it spends, without which it can't be played; distance: how far the ship steps sideways
        parameters: { cost: 1, evasion: 40, momentumCost: 2, distance: 1.5 },
    },
    drift: {
        targetType: 'location',
        rarity: 'uncommon',
        system: 'helm',
        // The path isn't made from these: it slides the way the ship is already going (see `calculateDriftPath`), so neither speed nor rotation applies.
        baseRotationSpeed: 0,
        baseSpeed: 0,
        // minMomentum: the levels of Momentum it needs, to be played; distancePerMomentum: how far the ship slides for each level of Momentum it spends; evasionPerMomentum: extra evasion, while it does, for each level spent
        parameters: { cost: 2, evasion: 0, minMomentum: 1, distancePerMomentum: 1.5, evasionPerMomentum: 8 },
    },
    evasiveManeuvers: {
        targetType: 'choice',
        rarity: 'common',
        system: 'helm',
        cards: ['patternAlpha', 'patternBeta', 'patternGamma'],
        // The same as its options have: the evasion of a maneuver is read from the card that was played, which is this one
        parameters: { cost: 2, evasion: evasivePatternEvasion },
    },
    // Each pattern's path is in common-data (`calculatePatternPath`), so that the helm can preview it
    patternAlpha: {
        targetType: 'no-target',
        system: 'helm',
        // accuracyLoss: percentage points taken off the accuracy of the ship's own weapons; duration: how long the pattern takes, in seconds
        parameters: { cost: 2, evasion: evasivePatternEvasion, accuracyLoss: evasivePatternAccuracyLoss, duration: evasivePatternDuration / 1000 },
    },
    patternBeta: {
        targetType: 'no-target',
        system: 'helm',
        parameters: { cost: 2, evasion: evasivePatternEvasion, accuracyLoss: evasivePatternAccuracyLoss, duration: evasivePatternDuration / 1000 },
    },
    patternGamma: {
        targetType: 'no-target',
        system: 'helm',
        parameters: { cost: 2, evasion: evasivePatternEvasion, accuracyLoss: evasivePatternAccuracyLoss, duration: evasivePatternDuration / 1000 },
    },
    broadside: {
        targetType: 'location',
        system: 'helm',
        // Turn to face the target (finishing the turn on the move), then turn side-on towards the closest hostile ship half way along, and straighten up again
        path: { shape: 'broadside' },
        turnWhileMoving: 35 * Math.PI / 180,
        baseRotationSpeed: 1,
        baseSpeed: 1,
        parameters: { cost: 1, evasion: 0 },
    },
    slingshot: {
        targetType: 'location',
        rarity: 'uncommon',
        system: 'helm',
        // Fly at the closest hostile ship, swing round its far side, and out to the target. Can't be played with no hostile ship about.
        path: { shape: 'slingshot', radius: 2 },
        turnWhileMoving: 35 * Math.PI / 180,
        baseRotationSpeed: 1.25,
        baseSpeed: 1.75,
        minDistance: 3,
        // momentum: the levels of Momentum gained by playing it
        parameters: { cost: 3, evasion: 30, momentum: 2 },
    },
    lockOn: {
        targetType: 'ship',
        targetRelationship: 'hostile',
        system: 'helm',
        // accuracy: percentage points added to the accuracy of the ship's own weapons; duration: how long the ship holds still, turning to face the target ship, in seconds
        parameters: { cost: 2, evasion: 0, accuracy: 20, duration: lockOnDuration / 1000 },
    },
    orbit: {
        targetType: 'ship',
        system: 'helm',
        // duration: how long the ship keeps circling the target ship, in seconds; momentum: the levels of Momentum gained after every momentumInterval seconds of it
        parameters: { cost: 2, evasion: 15, duration: 10, momentum: 1, momentumInterval: 3 },
    },
    circleStrafe: {
        targetType: 'ship',
        targetRelationship: 'hostile',
        rarity: 'rare',
        system: 'helm',
        // duration: how long the ship keeps circling the target ship, facing it all the while, in seconds
        parameters: { cost: 5, evasion: 15, duration: 8 },
    },
    interpose: {
        targetType: 'ship',
        targetRelationship: 'friendly',
        rarity: 'uncommon',
        system: 'helm',
        // duration: how long the ship holds its place between the target ship and the hostile ship closest to it, in seconds
        parameters: { cost: 2, evasion: 0, duration: 8 },
    },
    shadow: {
        targetType: 'ship',
        targetRelationship: 'hostile',
        rarity: 'uncommon',
        system: 'helm',
        // duration: how long the ship keeps to the target ship's rear arc, in seconds; rearArc: how many degrees either side of straight behind the target that arc reaches
        parameters: { cost: 2, evasion: 10, duration: 8, rearArc: 60 },
    },
    attackRun: {
        targetType: 'ship',
        targetRelationship: 'hostile',
        rarity: 'uncommon',
        system: 'helm',
        // duration: how long the maneuver lasts, in seconds; power: how much extra power tactical has while it does; passDistance: how far beside the target ship it passes, and behind it it ends, in units
        parameters: { cost: 3, evasion: 15, duration: 8, power: 1, passDistance: 2.5 },
    },
    warpAway: {
        targetType: 'no-target',
        system: 'helm',
        traits: ['priority'],
        parameters: { cost: 0 },
    },
});
