import { defineEffects, defineSharedContent } from 'common-data/content/SharedContent';
import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';

/** How long the mark of a customs platform's inspection ping stays on the system it landed on. */
export const inspectionPingDuration = 8000;

const effects = defineEffects({
    // What a customs platform's inspection ping leaves behind. They do nothing: which one it is says how the platform is keyed.
    phasedPing: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
        duration: inspectionPingDuration,
    },
    coherentPing: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
        duration: inspectionPingDuration,
    },
    invertedPing: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
        duration: inspectionPingDuration,
    },
});

export const standingOrdersShared = defineSharedContent({ effects });
