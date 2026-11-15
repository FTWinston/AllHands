import { defineEngineEffects } from 'engine/content/EngineContent';
import { effects as sharedEffects } from './quarantineGateEffects.shared';

export const effects = defineEngineEffects(sharedEffects, {
    // Aux Power without its taking itself off every other system.
    keyPower: {
        apply: (system) => {
            system.adjustSystemPowerLevel(1);
            return true;
        },
        remove: (system) => {
            system.adjustSystemPowerLevel(-1);
        },
    },
    // Nothing to do here either: the quarantine gate decides what these are worth.
    gatePulse: {
        apply: () => true,
        remove: () => {},
    },
    keyTurned: {
        apply: () => true,
        remove: () => {},
    },
});
