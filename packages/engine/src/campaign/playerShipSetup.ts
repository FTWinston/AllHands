import type { PlayerShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';

export const playerShipSetup: PlayerShipSetupInfo = {
    name: 'Ship',
    position: { x: 0, y: 0, angle: 0 },
    hull: {
        // 120 shield capacity, sometimes tuned against energy weapons or torpedoes.
        cards: Array(2).fill(['hullShieldEmitter', 'hullShieldTuningEnergy', 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldTuningTorpedo']).flat(),
        maxPowerLevel: 5,
        initialHandSize: 0,
    },
    reactor: {
        cards: Array(3).fill(['reactorPowerHull', 'reactorPowerHelm', 'reactorPowerTactical', 'reactorPowerEngineer', 'reactorPowerScience', 'reactorPowerReactor']).flat(),
        maxPowerLevel: 5,
        initialHandSize: 0,
    },
    helm: {
        cards: ['slowAndSteady', 'faceTarget', 'strafe', 'zigZag', 'zigZag', 'sweep', 'burn', 'holdSteady'],
        maxPowerLevel: 5,
        initialHandSize: 1,
    },
    science: {
        cards: ['passiveScan', 'antiprotonScan', 'polaronScan', 'tetryonScan', 'coherentBeamScan', 'phasedBurstScan', 'crossReference', 'gravitonScan'],
        maxPowerLevel: 5,
        initialHandSize: 1,
    },
    tactical: {
        numSlots: 2,
        cards: ['phaserStrip', 'phaserStrip', 'phaserCannon', 'photonTorpedo', 'efficiency', 'highYield', 'powerCell', 'acquireLock'],
        maxPowerLevel: 5,
        initialHandSize: 1,
    },
    engineer: {
        cards: ['juryRig', 'purge', 'focusShields', 'swapSystems', 'priorityFeed', 'trickleCharge', 'redline', 'runQuiet'],
        maxPowerLevel: 5,
        initialHandSize: 1,
    },
};
