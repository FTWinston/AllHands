import { defineEngineContent } from 'engine/content/EngineContent';
import { tollCollectorsDefinition } from './TollCollectorsEncounter.engine';

export const tollCollectorsEngine = defineEngineContent({
    encounters: [tollCollectorsDefinition],
});
