import { fighterTemplate } from 'content/general/ships/ships.engine';
import { system, inertTemplate } from 'engine/campaign/shipDesigns';
import { defineEngineContent } from 'engine/content/EngineContent';
import { quietRunningDefinition } from './QuietRunningEncounter.engine';

export const quietRunningEngine = defineEngineContent({
    encounters: [quietRunningDefinition],
    designs: {
        // A fighter on watch: its shields and decks, but armed only with a cannon, so it has to close to 10 to hurt anything. Its reactor gives tactical 3, which the cannon needs.
        // With the fighter's torpedo and Full Spread, six of them hunting killed the crew in most runs. It never runs.
        picket: {
            name: 'Picket',
            ...fighterTemplate,
            appearance: 'wedge-destroyer',
            tactical: { ...system(['phaserCannon', 'phaserCannon']), numSlots: 1 },
            fleeThreshold: 0,
        },
        // Not a ship: a relay station, with nobody aboard to fly it or fight. 30 bare hull and no shields.
        relay: { name: 'Relay', ...inertTemplate('ring-vessel', Array<'hullBare'>(30).fill('hullBare')) },
    },
});
