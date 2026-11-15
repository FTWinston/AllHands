import { defineEngineContent } from 'engine/content/EngineContent';
import { feverShipShared } from './feverShip.shared';
import { feverShipDefinition } from './FeverShipEncounter.engine';
import { designs } from './ships/feverShipShips.engine';

export const feverShipEngine = defineEngineContent({
    shared: feverShipShared,
    encounters: [feverShipDefinition],
    designs,
});
