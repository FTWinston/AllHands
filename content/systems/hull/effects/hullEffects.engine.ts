import { defineEngineEffects } from 'engine/content/EngineContent';
import { effects as sharedEffects } from './hullEffects.shared';

export const effects = defineEngineEffects(sharedEffects, {
    // HullState switches the shields between these tunings as hull cards are played, and counts down any scrambling.
    shieldReinforced: {
        apply: (system) => {
            return system.system === 'hull';
        },
        remove: () => { },
    },
    shieldTunedEnergy: {
        apply: (system) => {
            return system.system === 'hull';
        },
        remove: () => { },
    },
    shieldTunedTorpedo: {
        apply: (system) => {
            return system.system === 'hull';
        },
        remove: () => { },
    },
});
