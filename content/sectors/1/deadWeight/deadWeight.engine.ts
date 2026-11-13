import { fighterTemplate } from 'content/general/ships/ships.engine';
import { system, reactorCards, inertTemplate } from 'engine/campaign/shipDesigns';
import { defineEngineContent } from 'engine/content/EngineContent';
import { deadWeightDefinition } from './DeadWeightEncounter.engine';

export const deadWeightEngine = defineEngineContent({
    encounters: [deadWeightDefinition],
    designs: {
        // A working boat, with a strip for a gun. Every helm card is Slow and Steady, and there are a dozen, so its engines take several hits to put out.
        // Its shields (30) are over 18 bare hull. Its engineer is switched off, so nothing aboard repairs anything. It never runs.
        tug: {
            name: 'Tug',
            ...fighterTemplate,
            appearance: 'tug-and-tow',
            hull: system([...Array<'hullBare'>(18).fill('hullBare'), 'hullShieldEmitter', 'hullShieldEmitter'], 0),
            reactor: system(reactorCards(2), 0),
            helm: system(Array<'slowAndSteady'>(12).fill('slowAndSteady')),
            tactical: { ...system(['phaserStrip', 'phaserStrip']), numSlots: 1 },
            fleeThreshold: 0,
            priorities: { engineer: 0 },
        },
        // Not a ship at all: a station module, with nobody aboard and nothing to power it, so all it has is 40 bare hull and no shields. Whoever has it moves it.
        waterModule: { name: 'Water Module', ...inertTemplate('mining-barge', Array<'hullBare'>(40).fill('hullBare')) },
    },
});
