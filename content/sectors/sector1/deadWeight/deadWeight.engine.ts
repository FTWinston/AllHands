import { defineEngineContent } from 'engine/content/EngineContent';
import { deadWeightShared } from './deadWeight.shared';
import { deadWeightDefinition } from './DeadWeightEncounter.engine';
import { designs } from './ships/deadWeightShips.engine';

export const deadWeightEngine = defineEngineContent({
    shared: deadWeightShared,
    encounters: [deadWeightDefinition],
    designs,
});
