import { defineEngineContent } from 'engine/content/EngineContent';
import { designs } from './ships/slowBoatShips.engine';
import { slowBoatShared } from './slowBoat.shared';
import { offerAnswers, offerAtMs, slowBoatDefinition } from './SlowBoatEncounter.engine';

export { offerAnswers, offerAtMs };

export const slowBoatEngine = defineEngineContent({
    shared: slowBoatShared,
    encounters: [slowBoatDefinition],
    designs,
});
