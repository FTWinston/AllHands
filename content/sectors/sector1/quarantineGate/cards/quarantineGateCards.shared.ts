import { defineCards } from 'common-data/content/SharedContent';
import { keyPowerDuration, keyTurnedDuration } from 'content/sectors/sector1/quarantineGate/effects/quarantineGateEffects.shared';

export const cards = defineCards({
    // The quarantine gate's Shutdown Keys, one for each station, as every card belongs to one system. They're only ever handed out by the gate's keepers.
    shutdownKeyHelm: {
        targetType: 'no-target',
        system: 'helm',
        traits: ['priority'],
        parameters: { cost: 4, duration: keyTurnedDuration / 1000 },
    },
    shutdownKeyScience: {
        targetType: 'no-target',
        system: 'science',
        traits: ['priority'],
        parameters: { cost: 4, duration: keyTurnedDuration / 1000 },
    },
    shutdownKeyTactical: {
        targetType: 'no-target',
        system: 'tactical',
        traits: ['priority'],
        parameters: { cost: 4, duration: keyTurnedDuration / 1000 },
    },
    shutdownKeyEngineer: {
        targetType: 'no-target',
        system: 'engineer',
        traits: ['priority'],
        parameters: { cost: 4, duration: keyTurnedDuration / 1000 },
    },
    // What the gate's keepers give the engineer to power the keys with. Aux Power can only be on one system at a time, and the keys need four.
    keyPower: {
        targetType: 'system',
        system: 'engineer',
        traits: ['priority'],
        parameters: { cost: 1, powerGain: 1, duration: keyPowerDuration / 1000 },
    },
});
