import { defineEngineEffects } from 'engine/content/EngineContent';
import { effects as sharedEffects } from './standingOrdersEffects.shared';

export const effects = defineEngineEffects(sharedEffects, {
    // These do nothing: they're only there to be read, by whoever is working out how a customs platform is keyed.
    phasedPing: {
        apply: () => true,
        remove: () => {},
    },
    coherentPing: {
        apply: () => true,
        remove: () => {},
    },
    invertedPing: {
        apply: () => true,
        remove: () => {},
    },
});
