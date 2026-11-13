import { defineEffects, defineSharedContent } from 'common-data/content/SharedContent';
import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';

const effects = defineEffects({
    /** How many more hull cards that would tune the shields must be played before they can tune them again. */
    shieldScrambled: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
    },
    damagedCard: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
    },
    feedback: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        duration: 20_000,
    },
    disruptGeneration: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
    },
    reactorBreach: {
        category: SystemEffectCategory.Negative,
        usesLevels: false,
        duration: 3_000,
    },
});

export const effectsShared = defineSharedContent({ effects });
