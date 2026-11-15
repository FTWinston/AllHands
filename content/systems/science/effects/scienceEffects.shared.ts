import { defineEffects } from 'common-data/content/SharedContent';
import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';

export const effects = defineEffects({
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
    // What science has learned from its scans, which some of its cards spend. It's kept until spent, or the encounter ends.
    insight: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: 5,
    },
    // Sits on the helm of a ship whose fire is being predicted. Its level is the percentage points of accuracy that its shots lose.
    predictiveModel: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        duration: 8_000,
    },
    // Sits on a ship's helm. Its level is the percentage of speed that manoeuvres started under it lose.
    gravitonDrag: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        maxLevel: 75,
        duration: 10_000,
    },
    // Stops the time running down on the particle effects that are on the same system.
    halfLife: {
        category: SystemEffectCategory.Negative,
        usesLevels: false,
        duration: 15_000,
        tickInterval: 250,
    },
    // Takes away all of a system's power.
    crossReaction: {
        category: SystemEffectCategory.Negative,
        usesLevels: false,
        duration: 4_000,
    },
});

/** The effects that scan cards leave on the systems of the ships they scan, which the Catalyst cards work with. */
export const particleEffects = [
    'antiprotonResidue',
    'tetryonSaturation',
    'chronitonSaturation',
    'polaronBombardment',
    'gravitonDrag',
] as const satisfies readonly (keyof typeof effects)[];

export type ParticleEffect = typeof particleEffects[number];
