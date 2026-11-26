import { defineCards } from 'common-data/content/SharedContent';
import { CardMotionSegmentFacing } from 'common-data/features/cards/types/CardDefinition';
import { evasivePatternDuration, holdSteadyDuration } from 'content/systems/helm/effects/helmEffects.shared';

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
    slowReverse: {
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
        baseSpeed: 1.25,
        // Fixed legs and width, so a longer move has more legs rather than a wider path
        path: { shape: 'zigZag', legLength: 1.2, width: 0.5 },
        minDistance: 3,
        parameters: { cost: 2, evasion: 25 },
    },
    feint: {
        targetType: 'location',
        system: 'helm',
        // Rotate to set off at an angle to the target, then cut back to it, ending facing the way it's going
        path: { shape: 'feint', angle: 55 * Math.PI / 180, legFraction: 1 / 3 },
        baseRotationSpeed: 1.25,
        baseSpeed: 1.25,
        minDistance: 4,
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
    faceTarget: {
        targetType: 'location',
        system: 'helm',
        // Rotate to face the target, no movement
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
    fullImpulse: {
        targetType: 'location',
        rarity: 'uncommon',
        system: 'helm',
        // Rotate to face target first, then move straight towards it
        startFacing: CardMotionSegmentFacing.FinalVector,
        endFacing: CardMotionSegmentFacing.FinalVector,
        baseRotationSpeed: 1,
        baseSpeed: 1,
        minDistance: 3,
        // speedPerMomentum: percentage of extra speed for each level of Momentum held; evasionPerMomentum: extra evasion for each level
        parameters: { cost: 2, evasion: 10, speedPerMomentum: 15, evasionPerMomentum: 8 },
    },
    evasivePattern: {
        targetType: 'no-target',
        system: 'helm',
        // accuracyLoss: percentage points taken off the accuracy of the ship's own weapons; duration: how long the ship jinks for, in seconds
        parameters: { cost: 2, evasion: 40, accuracyLoss: 25, duration: evasivePatternDuration / 1000 },
    },
    holdSteady: {
        targetType: 'no-target',
        system: 'helm',
        // accuracy: percentage points added to the accuracy of the ship's own weapons; duration: how long the ship holds still for, in seconds
        parameters: { cost: 1, evasion: 0, accuracy: 20, duration: holdSteadyDuration / 1000 },
    },
    broadside: {
        targetType: 'location',
        system: 'helm',
        // Don't rotate before moving: turn side-on towards the closest hostile ship half way along, then straighten up to face the way it's going
        path: { shape: 'broadside' },
        baseRotationSpeed: 1,
        baseSpeed: 1,
        parameters: { cost: 1, evasion: 0 },
    },
    slingshot: {
        targetType: 'choice',
        rarity: 'uncommon',
        system: 'helm',
        cards: ['slingshotLeft', 'slingshotRight'],
        // The same as its options have: the evasion of a maneuver is read from the card that was played, which is this one
        parameters: { cost: 3, evasion: 30, momentum: 1 },
    },
    slingshotLeft: {
        targetType: 'location',
        system: 'helm',
        startFacing: CardMotionSegmentFacing.FinalVector,
        startFacingOffset: -Math.PI / 2, // Start facing 90 degrees left of destination
        endFacing: CardMotionSegmentFacing.FinalVector,
        endFacingOffset: Math.PI / 2, // End facing 90 degrees right of destination
        baseRotationSpeed: 1.25,
        baseSpeed: 1.25,
        // Half circle bulging right (positive = right of movement direction)
        perpendicularPositionOffsets: [0.31, 0.42, 0.47, 0.5, 0.5, 0.47, 0.42, 0.31],
        minDistance: 6,
        // momentum: the levels of Momentum gained by playing it
        parameters: { cost: 3, evasion: 30, momentum: 1 },
    },
    slingshotRight: {
        targetType: 'location',
        system: 'helm',
        startFacing: CardMotionSegmentFacing.FinalVector,
        startFacingOffset: Math.PI / 2, // Start facing 90 degrees right of destination
        endFacing: CardMotionSegmentFacing.FinalVector,
        endFacingOffset: -Math.PI / 2, // End facing 90 degrees left of destination
        baseRotationSpeed: 1.25,
        baseSpeed: 1.25,
        // Half circle bulging left (negative = left of movement direction)
        perpendicularPositionOffsets: [-0.31, -0.42, -0.47, -0.5, -0.5, -0.47, -0.42, -0.31],
        minDistance: 6,
        // momentum: the levels of Momentum gained by playing it
        parameters: { cost: 3, evasion: 30, momentum: 1 },
    },
    lockOn: {
        targetType: 'no-target',
        rarity: 'uncommon',
        system: 'helm',
        // duration: how long the ship keeps turning to face the closest hostile ship, in seconds
        parameters: { cost: 2, evasion: 0, duration: 8 },
    },
    matchCourse: {
        targetType: 'ship',
        rarity: 'uncommon',
        system: 'helm',
        // duration: how long the ship keeps station alongside the target ship, in seconds
        parameters: { cost: 2, evasion: 0, duration: 8 },
    },
    orbit: {
        targetType: 'ship',
        system: 'helm',
        // duration: how long the ship keeps circling the target ship, in seconds
        parameters: { cost: 2, evasion: 15, duration: 10 },
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
        // duration: how long the ship keeps to the target ship's rear arc, in seconds
        parameters: { cost: 2, evasion: 10, duration: 8 },
    },
    breakAway: {
        targetType: 'ship',
        targetRelationship: 'hostile',
        system: 'helm',
        // distance: how far the ship flies directly away from the target ship; momentum: the levels of Momentum gained by playing it
        parameters: { cost: 2, evasion: 20, distance: 6, momentum: 1 },
    },
    attackRun: {
        targetType: 'location',
        rarity: 'uncommon',
        system: 'helm',
        // Rotate to face target first, then move straight towards it, fast
        startFacing: CardMotionSegmentFacing.FinalVector,
        endFacing: CardMotionSegmentFacing.FinalVector,
        baseRotationSpeed: 1,
        baseSpeed: 1.5,
        minDistance: 4,
        // costReduction: how much less tactical's cards cost to play while the maneuver lasts
        parameters: { cost: 3, evasion: 15, costReduction: 1 },
    },
    warpAway: {
        targetType: 'no-target',
        system: 'helm',
        traits: ['priority'],
        parameters: { cost: 0 },
    },
});
