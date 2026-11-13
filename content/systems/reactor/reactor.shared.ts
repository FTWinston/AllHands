import { defineCards, defineEffects, defineSharedContent } from 'common-data/content/SharedContent';
import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';
import { MAX_POWER_LEVEL } from 'common-data/features/ships/utils/powerLevel';

const effects = defineEffects({
    reducedPower: {
        category: SystemEffectCategory.Neutral,
        usesLevels: true,
        maxLevel: MAX_POWER_LEVEL,
    },
});

const cards = defineCards({
    reactorPowerHull: {
        targetType: 'no-target',
        system: 'reactor',
        parameters: { cost: 0 },
    },
    reactorPowerReactor: {
        targetType: 'no-target',
        system: 'reactor',
        parameters: { cost: 0 },
    },
    reactorPowerHelm: {
        targetType: 'no-target',
        system: 'reactor',
        parameters: { cost: 0 },
    },
    reactorPowerScience: {
        targetType: 'no-target',
        system: 'reactor',
        parameters: { cost: 0 },
    },
    reactorPowerTactical: {
        targetType: 'no-target',
        system: 'reactor',
        parameters: { cost: 0 },
    },
    reactorPowerEngineer: {
        targetType: 'no-target',
        system: 'reactor',
        parameters: { cost: 0 },
    },
});

export const reactorShared = defineSharedContent({ cards, effects });
