import { system, reactorCards, type DesignTemplate } from 'engine/campaign/shipDesigns';
import { defineEngineContent } from 'engine/content/EngineContent';

/** The original "An Enemy" ship from the old default scenario; all other designs are tweaks of it. */
export const fighterTemplate: DesignTemplate = {
    appearance: 'swallowtail-interceptor',
    // 60 shield capacity, sometimes tuned against energy weapons.
    hull: system(['hullShieldEmitter', 'hullShieldTuningEnergy', 'hullBare', 'hullShieldEmitter', 'hullShieldTuningEnergy', 'hullBare', 'hullShieldEmitter', 'hullShieldEmitter'], 0),
    // Loading a torpedo takes 3 tactical power.
    reactor: system(reactorCards(2, 'reactorPowerTactical'), 0),
    helm: system(['slowAndSteady', 'zigZag', 'strafe', 'slowAndSteady']),
    science: system(['passiveScan', 'passiveScan', 'passiveScan', 'passiveScan', 'passiveScan']),
    tactical: { ...system(['photonTorpedo', 'lowYield', 'fullSpread']), numSlots: 1 },
    engineer: system(['auxPower', 'auxPower', 'distributePower']),
};

export const shipsEngine = defineEngineContent({
    designs: {
        harrier: {
            name: 'Harrier',
            ...fighterTemplate,
            appearance: 'dart-fighter',
            // A small shield (30), and a flimsy hull.
            hull: system(['hullShieldEmitter', 'hullShieldTuningEnergy', 'hullBare', 'hullShieldEmitter', 'hullBare'], 0),
            reactor: system(reactorCards(2, 'reactorPowerTactical', 'reactorPowerHelm'), 0),
            helm: system(['zigZag', 'strafe', 'zigZag', 'slowAndSteady']),
            tactical: { ...system(['lowYield', 'lowYield', 'photonTorpedo']), numSlots: 1 },
            fleeThreshold: 0.4,
        },
        fighter: { name: 'Fighter', ...fighterTemplate },
        bulwark: {
            name: 'Heavy Cruiser',
            ...fighterTemplate,
            appearance: 'hammerhead-cruiser',
            // A big shield (135), a third of it from a volatile emitter, sometimes tuned against torpedoes.
            hull: system([
                'hullShieldEmitter', 'hullVolatileEmitter', 'hullShieldTuningTorpedo', 'hullBare', 'hullShieldEmitter', 'hullShieldTuningTorpedo',
                'hullBare', 'hullShieldEmitter', 'hullBare', 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldEmitter',
            ], 0),
            reactor: system(reactorCards(2, 'reactorPowerTactical', 'reactorPowerHull', 'reactorPowerEngineer'), 0),
            tactical: { ...system(['photonTorpedo', 'lowYield', 'fullSpread', 'photonTorpedo', 'lowYield']), numSlots: 2 },
            engineer: system(['auxPower', 'auxPower', 'distributePower', 'auxPower']),
            fleeThreshold: 0,
        },
        flagship: {
            name: 'Flagship',
            ...fighterTemplate,
            appearance: 'manta-command-ship',
            // The biggest shield (210), with two volatile emitters, sometimes tuned against energy weapons or torpedoes.
            hull: system([
                'hullShieldEmitter', 'hullVolatileEmitter', 'hullShieldTuningEnergy', 'hullShieldTuningTorpedo', 'hullBare', 'hullShieldEmitter', 'hullVolatileEmitter', 'hullShieldTuningEnergy',
                'hullShieldTuningTorpedo', 'hullBare', 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldEmitter',
            ], 0),
            reactor: system(reactorCards(3, 'reactorPowerTactical', 'reactorPowerHull'), 0),
            tactical: { ...system(['photonTorpedo', 'lowYield', 'fullSpread', 'photonTorpedo', 'lowYield', 'fullSpread']), numSlots: 3 },
            engineer: system(['auxPower', 'auxPower', 'distributePower', 'auxPower', 'distributePower']),
            fleeThreshold: 0,
        },
        // A harrier with half the hull, and nobody aboard to think better of it.
        drone: {
            name: 'Drone',
            ...fighterTemplate,
            appearance: 'mantis-drone',
            hull: system(['hullShieldEmitter', 'hullBare', 'hullBare'], 0),
            reactor: system(reactorCards(2, 'reactorPowerTactical', 'reactorPowerHelm'), 0),
            helm: system(['zigZag', 'strafe', 'zigZag', 'slowAndSteady']),
            tactical: { ...system(['lowYield', 'lowYield', 'photonTorpedo']), numSlots: 1 },
            fleeThreshold: 0,
        },
    },
});
