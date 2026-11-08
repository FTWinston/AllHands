import type { PlayerShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';

export const playerShipSetup: PlayerShipSetupInfo = {
    name: 'Ship',
    position: { x: 0, y: 0, angle: 0 },
    hull: {
        // 100 shield capacity, recharging by 3 plus the hull's power level, 2 hull cards after being hit.
        cards: Array(3).fill(['hullShieldEmitter', 'hullShieldRegenerator', 'hullShieldEmitter', 'hullShieldRestart']).flat(),
        shieldCapacity: 40,
        shieldCharge: 0,
        shieldRechargeDelay: 5,
        maxPowerLevel: 5,
        initialHandSize: 0,
    },
    reactor: {
        cards: Array(3).fill(['reactorPowerHull', 'reactorPowerHelm', 'reactorPowerTactical', 'reactorPowerEngineer', 'reactorPowerScience', 'reactorPowerReactor']).flat(),
        maxPowerLevel: 5,
        initialHandSize: 0,
    },
    helm: {
        cards: ['slowAndSteady', 'zigZag', 'strafe', 'faceTarget', 'exampleNoTarget', 'sweep', 'sweep', 'slowAndSteady', 'zigZag', 'slowAndSteady'],
        maxPowerLevel: 5,
        initialHandSize: 1,
    },
    science: {
        cards: ['passiveScan', 'phasedBurstScan', 'polaronScan', 'invertedPulseScan', 'tetryonScan', 'coherentChronitonScan'],
        maxPowerLevel: 5,
        initialHandSize: 1,
    },
    tactical: {
        numSlots: 2,
        cards: ['phaserStrip', 'exampleEnemyTarget', 'exampleNoTarget', 'phaserCannon', 'phaserStrip', 'photonTorpedo', 'lowYield', 'highYield', 'fullSpread', 'weaponOvercharge', 'subCritical', 'rapidFire'],
        maxPowerLevel: 5,
        initialHandSize: 1,
    },
    engineer: {
        cards: ['swapSystems', 'exampleNoTarget'],
        maxPowerLevel: 5,
        initialHandSize: 1,
    },
};
