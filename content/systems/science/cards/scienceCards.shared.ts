import { defineCards } from 'common-data/content/SharedContent';
import { CardMotionSegmentFacing } from 'common-data/features/cards/types/CardDefinition';
import { effects } from 'content/systems/science/effects/scienceEffects.shared';

/** How long (in ms) the hostile ships that Active Ping reveals this ship to go on knowing where it is. */
export const pingDuration = 10_000;
/** How long (in ms) Passive Listen takes to reveal a system. */
export const passiveListenDelay = 3_000;
/** How long (in ms) the ghost that Sensor Ghost leaves lasts. */
export const sensorGhostDuration = 15_000;

export const cards = defineCards({
    passiveScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 1,
        },
    },
    antiprotonScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 2,
            effectLevel: 25,
            duration: effects.antiprotonResidue.duration / 1000,
        },
        deflectorSubstance: 'Antiproton',
    },
    tetryonScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 2,
            scrambleCards: 3,
        },
        deflectorSubstance: 'Tetryon',
    },
    chronitonScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 2,
            duration: effects.chronitonSaturation.duration / 1000,
        },
        deflectorSubstance: 'Chroniton',
    },
    polaronScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 2,
            effectLevel: 1,
            duration: effects.polaronBombardment.duration / 1000,
        },
        deflectorSubstance: 'Polaron',
    },
    invertedPulseScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 3,
        },
        deflectorModifier: 'Inverted',
        deflectorDelivery: 'Pulse',
    },
    coherentBeamScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 3,
        },
        deflectorModifier: 'Coherent',
        deflectorDelivery: 'Beam',
    },
    phasedBurstScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 3,
        },
        deflectorModifier: 'Phased',
        deflectorDelivery: 'Burst',
    },
    phasedPolaronScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 3,
            duration: effects.polaronAccumulation.duration / 1000,
        },
        deflectorModifier: 'Phased',
        deflectorSubstance: 'Polaron',
    },
    coherentTetryonScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 3,
        },
        deflectorModifier: 'Coherent',
        deflectorSubstance: 'Tetryon',
    },
    coherentChronitonScan: {
        targetType: 'scan',
        rarity: 'rare',
        system: 'science',
        parameters: {
            cost: 4,
        },
        deflectorModifier: 'Coherent',
        deflectorSubstance: 'Chroniton',
        deflectorDelivery: 'Beam',
    },
    invertedAntiprotonScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 3,
            effectLevel: 15,
            duration: effects.antiprotonResidue.duration / 1000,
        },
        deflectorModifier: 'Inverted',
        deflectorSubstance: 'Antiproton',
    },
    invertedChronitonScan: {
        targetType: 'scan',
        rarity: 'uncommon',
        system: 'science',
        parameters: {
            cost: 3,
        },
        deflectorModifier: 'Inverted',
        deflectorSubstance: 'Chroniton',
    },
    deepScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 3,
        },
    },
    gravitonScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 2,
            effectLevel: 40,
            duration: effects.gravitonDrag.duration / 1000,
        },
        deflectorSubstance: 'Graviton',
    },
    crossReference: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 2,
            extraInsight: 1,
        },
    },
    eureka: {
        targetType: 'no-target',
        rarity: 'uncommon',
        system: 'science',
        parameters: {
            cost: 1,
            insightCost: 3,
        },
    },
    predictiveModel: {
        targetType: 'no-target',
        rarity: 'uncommon',
        system: 'science',
        parameters: {
            cost: 1,
            insightCost: 2,
            accuracyReduction: 30,
            duration: effects.predictiveModel.duration / 1000,
        },
    },
    firingSolution: {
        targetType: 'no-target',
        rarity: 'uncommon',
        system: 'science',
        parameters: {
            cost: 1,
            insightCost: 2,
        },
    },
    // A science card that firingSolution puts in tactical's hand, and is played from there.
    firingSolutionShot: {
        targetType: 'weapon',
        system: 'science',
        instant: true,
        traits: ['expendable'],
        parameters: {
            cost: 0,
            accuracyIncrease: 40,
        },
    },
    plottedCourse: {
        targetType: 'no-target',
        rarity: 'uncommon',
        system: 'science',
        parameters: {
            cost: 1,
            insightCost: 2,
        },
    },
    // A science card that plottedCourse puts in helm's hand, and is played from there.
    plottedCourseManoeuvre: {
        targetType: 'location',
        system: 'science',
        traits: ['expendable'],
        // Rotate to face the destination first, then move straight to it, fast
        startFacing: CardMotionSegmentFacing.FinalVector,
        endFacing: CardMotionSegmentFacing.FinalVector,
        baseRotationSpeed: 1.25,
        baseSpeed: 1.25,
        parameters: {
            cost: 0,
            evasion: 40,
        },
    },
    activePing: {
        targetType: 'scan',
        rarity: 'uncommon',
        system: 'science',
        parameters: {
            cost: 3,
            range: 200,
            duration: pingDuration / 1000,
        },
    },
    passiveListen: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 1,
            delay: passiveListenDelay / 1000,
        },
    },
    jam: {
        targetType: 'no-target',
        rarity: 'uncommon',
        system: 'science',
        parameters: {
            cost: 2,
            duration: effects.jammed.duration / 1000,
        },
    },
    sensorGhost: {
        targetType: 'no-target',
        rarity: 'uncommon',
        system: 'science',
        parameters: {
            cost: 2,
            duration: sensorGhostDuration / 1000,
        },
    },
    catalyse: {
        targetType: 'no-target',
        rarity: 'uncommon',
        system: 'science',
        parameters: {
            cost: 2,
            damagePerEffect: 2,
        },
    },
    halfLife: {
        targetType: 'no-target',
        system: 'science',
        parameters: {
            cost: 1,
            duration: effects.halfLife.duration / 1000,
        },
    },
    crossReaction: {
        targetType: 'no-target',
        rarity: 'uncommon',
        system: 'science',
        parameters: {
            cost: 2,
            effectsNeeded: 2,
            duration: effects.crossReaction.duration / 1000,
        },
    },
    saturate: {
        targetType: 'no-target',
        rarity: 'uncommon',
        system: 'science',
        parameters: {
            cost: 2,
            multiplier: 2,
        },
    },
});
