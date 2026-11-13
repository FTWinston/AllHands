import { fighterTemplate } from 'content/general/ships/ships.engine';
import { system, reactorCards, inertTemplate } from 'engine/campaign/shipDesigns';
import { defineEngineContent } from 'engine/content/EngineContent';
import { lastShuttleOutDefinition } from './LastShuttleOutEncounter.engine';

export const lastShuttleOutEngine = defineEngineContent({
    encounters: [lastShuttleOutDefinition],
    designs: {
        // Not a ship either: a mining station that's being abandoned, with nobody left at the controls. 30 bare hull and no shields.
        miningStation: { name: 'Mining Station', ...inertTemplate('drydock-tender', Array<'hullBare'>(30).fill('hullBare')) },
        // An unarmed evacuation shuttle: all it can do is fly straight. Its shields (15) are fully powered, over 3 bare hull,
        // so it survives one cannon hit and not a second. Nobody aboard shoots or scans. It never runs.
        shuttle: {
            name: 'Shuttle',
            ...fighterTemplate,
            appearance: 'ring-courier',
            hull: system(['hullBare', 'hullBare', 'hullBare', 'hullShieldEmitter'], 0),
            reactor: system(reactorCards(2, 'reactorPowerHull', 'reactorPowerHull'), 0),
            helm: system(['slowAndSteady', 'slowAndSteady', 'slowAndSteady', 'slowAndSteady']),
            tactical: { ...system(['phaserStrip']), numSlots: 1 },
            fleeThreshold: 0,
            priorities: { tactical: 0, science: 0 },
        },
        // A piece of an old defence grid, with a cannon. Its shields (15) are over 2 bare hull. Its reactor gives tactical 3, which a cannon needs.
        // Whoever spawns one decides whether its gun still works, by switching its tactical officer off. It never runs.
        gridFragment: {
            name: 'Grid Fragment',
            ...fighterTemplate,
            appearance: 'sentry-drone',
            hull: system(['hullBare', 'hullBare', 'hullShieldEmitter'], 0),
            helm: system(['zigZag', 'strafe', 'slowAndSteady', 'slowAndSteady']),
            tactical: { ...system(['phaserCannon', 'phaserCannon', 'phaserCannon']), numSlots: 1 },
            fleeThreshold: 0,
        },
    },
});
