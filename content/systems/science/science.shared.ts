import { defineCards, defineEffects, defineSharedContent } from 'common-data/content/SharedContent';
import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';

const effects = defineEffects({
    antiprotonResidue: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        duration: 12_000,
    },
    chronitonSaturation: {
        category: SystemEffectCategory.Negative,
        usesLevels: false,
        duration: 45_000,
    },
    polaronBombardment: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        duration: 10_000,
    },
    polaronAccumulation: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: 10_000,
    },
    tetryonSaturation: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        duration: 8_000,
    },
    reducedCardCost: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
    },
});

const cards = defineCards({
    exampleNoTarget: {
        targetType: 'no-target',
        system: 'science',
        parameters: { cost: 2 },
    },
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
            duration: effects.antiprotonResidue.duration,
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
            duration: effects.chronitonSaturation.duration,
        },
        deflectorSubstance: 'Chroniton',
    },
    polaronScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 2,
            effectLevel: 1,
            duration: effects.polaronBombardment.duration,
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
            duration: 6,
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
            duration: effects.antiprotonResidue.duration,
        },
        deflectorModifier: 'Inverted',
        deflectorSubstance: 'Antiproton',
    },
    invertedChronitonScan: {
        targetType: 'scan',
        system: 'science',
        parameters: {
            cost: 3,
        },
        deflectorModifier: 'Inverted',
        deflectorSubstance: 'Chroniton',
    },
});

export const scienceShared = defineSharedContent({ cards, effects });
