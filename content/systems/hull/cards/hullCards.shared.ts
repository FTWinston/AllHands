import { defineCards } from 'common-data/content/SharedContent';

export const cards = defineCards({
    hullBare: {
        targetType: 'no-target',
        system: 'hull',
        parameters: { cost: 0 },
    },
    hullShieldEmitter: {
        targetType: 'no-target',
        system: 'hull',
        parameters: { cost: 0, shieldCapacity: 15 },
    },
    hullVolatileEmitter: {
        targetType: 'no-target',
        system: 'hull',
        parameters: { cost: 0, shieldCapacity: 45 },
    },
    hullShieldTuningEnergy: {
        targetType: 'no-target',
        system: 'hull',
        parameters: { cost: 0 },
    },
    hullShieldTuningTorpedo: {
        targetType: 'no-target',
        system: 'hull',
        parameters: { cost: 0 },
    },
});
