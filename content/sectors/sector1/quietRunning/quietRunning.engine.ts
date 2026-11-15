import { defineEngineContent } from 'engine/content/EngineContent';
import { quietRunningShared } from './quietRunning.shared';
import { quietRunningDefinition } from './QuietRunningEncounter.engine';
import { designs } from './ships/quietRunningShips.engine';

export const quietRunningEngine = defineEngineContent({
    shared: quietRunningShared,
    encounters: [quietRunningDefinition],
    designs,
});
