import { fighterTemplate } from 'content/general/general.engine';
import { system, reactorCards } from 'engine/campaign/shipDesigns';
import { defineDesigns } from 'engine/content/EngineContent';

/** The ship designs that only this encounter uses. */
export const designs = defineDesigns({
    // Not a warship: slow, with one short-range gun, and nothing to speak of under its shields (75). Those are fully powered, as they're all it has.
    clinicShip: {
        name: 'Clinic Ship',
        ...fighterTemplate,
        appearance: 'ring-spine-tender',
        hull: system(['hullShieldEmitter', 'hullBare', 'hullShieldEmitter', 'hullBare', 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldEmitter'], 0),
        reactor: system(reactorCards(2, 'reactorPowerHull', 'reactorPowerHull', 'reactorPowerHull'), 0),
        helm: system(['slowAndSteady', 'slowAndSteady', 'slowAndSteady', 'slowAndSteady']),
        tactical: { ...system(['phaserStrip', 'lowYield', 'phaserStrip']), numSlots: 1 },
        fleeThreshold: 0,
    },
});
