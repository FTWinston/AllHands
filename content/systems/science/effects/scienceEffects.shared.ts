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
});
