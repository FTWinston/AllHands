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
        // Rotate to face target first, then zig-zag towards it
        startFacing: CardMotionSegmentFacing.FinalVector,
        endFacing: CardMotionSegmentFacing.FinalVector,
        baseRotationSpeed: 1.25,
        baseSpeed: 1,
        perpendicularPositionOffsets: [-0.15, 0.25, -0.25, 0.15],
        minDistance: 3,
        parameters: { cost: 2, evasion: 25 },
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
        startFacing: CardMotionSegmentFacing.FinalVector,
        startFacingOffset: -Math.PI / 4, // Start facing 45 degrees left of destination
        endFacing: CardMotionSegmentFacing.FinalVector,
        endFacingOffset: Math.PI / 4, // End facing 45 degrees right of destination
        baseRotationSpeed: 1,
        baseSpeed: 1,
        // Sine curve bulging right (positive = right of movement direction)
        perpendicularPositionOffsets: [0.14, 0.26, 0.35, 0.39, 0.39, 0.35, 0.26, 0.14],
        parameters: { cost: 2, evasion: 15 },
    },
    sweepRight: {
        targetType: 'location',
        system: 'helm',
        startFacing: CardMotionSegmentFacing.FinalVector,
        startFacingOffset: Math.PI / 4, // Start facing 45 degrees right of destination
        endFacing: CardMotionSegmentFacing.FinalVector,
        endFacingOffset: -Math.PI / 4, // End facing 45 degrees left of destination
        baseRotationSpeed: 1,
        baseSpeed: 1,
        // Sine curve bulging left (negative = left of movement direction)
        perpendicularPositionOffsets: [-0.14, -0.26, -0.35, -0.39, -0.39, -0.35, -0.26, -0.14],
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
        targetType: 'choice',
        system: 'helm',
        cards: ['broadsideLeft', 'broadsideRight'],
        parameters: { cost: 1 },
    },
    broadsideLeft: {
        targetType: 'location',
        system: 'helm',
        // Don't rotate before moving: turn during the move, to end facing 90 degrees left of the direction of travel
        endFacing: CardMotionSegmentFacing.FinalVector,
        endFacingOffset: -Math.PI / 2,
        baseRotationSpeed: 0.75,
        baseSpeed: 0.5,
        parameters: { cost: 1, evasion: 0 },
    },
    broadsideRight: {
        targetType: 'location',
        system: 'helm',
        // Don't rotate before moving: turn during the move, to end facing 90 degrees right of the direction of travel
        endFacing: CardMotionSegmentFacing.FinalVector,
        endFacingOffset: Math.PI / 2,
        baseRotationSpeed: 0.75,
        baseSpeed: 0.5,
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
        targetType: 'ship',
        targetRelationship: 'hostile',
        rarity: 'uncommon',
        system: 'helm',
        // duration: how long the maneuver lasts, in seconds; power: how much extra power tactical has while it does
        parameters: { cost: 3, evasion: 15, duration: 8, power: 1 },
    },
    warpAway: {
        targetType: 'no-target',
        system: 'helm',
        traits: ['priority'],
        parameters: { cost: 0 },
    },
});
