import { defineCards, defineSharedContent } from 'common-data/content/SharedContent';
import { CardMotionSegmentFacing } from 'common-data/features/cards/types/CardDefinition';

const cards = defineCards({
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
    fullReverse: {
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
        maxDistance: 4,
        parameters: { cost: 1, evasion: 15 },
    },
    sweep: {
        targetType: 'choice',
        system: 'helm',
        cards: ['sweepLeft', 'sweepRight'],
        parameters: { cost: 2 },
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
    warpAway: {
        targetType: 'no-target',
        system: 'helm',
        traits: ['priority'],
        parameters: { cost: 0 },
    },
});

export const helmShared = defineSharedContent({ cards });
