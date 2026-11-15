import { defineEngineEffects } from 'engine/content/EngineContent';
import { effects as sharedEffects } from './tacticalEffects.shared';

export const effects = defineEngineEffects(sharedEffects, {
    // Nothing to do here: an encounter that cares whether a flare is burning looks for this on a ship's tactical system.
    flareBurning: {
        apply: system => system.system === 'tactical',
        remove: () => {},
    },
});
