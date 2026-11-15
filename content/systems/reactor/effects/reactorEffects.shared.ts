import { defineEffects } from 'common-data/content/SharedContent';
import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';
import { MAX_POWER_LEVEL } from 'common-data/features/ships/utils/powerLevel';

export const effects = defineEffects({
    reducedPower: {
        category: SystemEffectCategory.Neutral,
        usesLevels: true,
        maxLevel: MAX_POWER_LEVEL,
    },
});
