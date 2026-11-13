import { fighterTemplate } from 'content/general/ships/ships.engine';
import { system, reactorCards } from 'engine/campaign/shipDesigns';
import { defineEngineContent } from 'engine/content/EngineContent';
import { feverShipDefinition } from './FeverShipEncounter.engine';

export const feverShipEngine = defineEngineContent({
    encounters: [feverShipDefinition],
    designs: {
        // Not a warship: every system at 2, five cards in each crew system, and a strip for a gun. Its reactor runs at 3, so it draws often enough for that gun to be a threat.
        // Its shields (60) are over 12 bare hull, so most hits to the hull don't cost it shield capacity. It never runs.
        hauler: {
            name: 'Hauler',
            ...fighterTemplate,
            appearance: 'armed-freighter',
            hull: system([...Array<'hullBare'>(12).fill('hullBare'), 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldEmitter'], 0),
            reactor: system(reactorCards(2, 'reactorPowerReactor'), 0),
            helm: system(['slowAndSteady', 'slowAndSteady', 'slowAndSteady', 'strafe', 'faceTarget']),
            science: system(['passiveScan', 'passiveScan', 'passiveScan', 'passiveScan', 'passiveScan']),
            tactical: { ...system(['phaserStrip', 'phaserStrip', 'phaserStrip', 'phaserStrip', 'phaserStrip']), numSlots: 1 },
            engineer: system(['distributePower', 'distributePower', 'distributePower', 'drawPower', 'drawPower']),
            fleeThreshold: 0,
        },
    },
});
