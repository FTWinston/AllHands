import { defineEngineContent } from 'engine/content/EngineContent';
import { lastShuttleOutShared } from './lastShuttleOut.shared';
import { lastShuttleOutDefinition } from './LastShuttleOutEncounter.engine';
import { designs } from './ships/lastShuttleOutShips.engine';

export const lastShuttleOutEngine = defineEngineContent({
    shared: lastShuttleOutShared,
    encounters: [lastShuttleOutDefinition],
    designs,
});
