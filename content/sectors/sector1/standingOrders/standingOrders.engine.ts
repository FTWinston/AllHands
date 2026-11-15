import { defineEngineContent } from 'engine/content/EngineContent';
import { effects } from './effects/standingOrdersEffects.engine';
import { designs } from './ships/standingOrdersShips.engine';
import { standingOrdersShared } from './standingOrders.shared';
import { standingOrdersDefinition } from './StandingOrdersEncounter.engine';

export const standingOrdersEngine = defineEngineContent({
    shared: standingOrdersShared,
    encounters: [standingOrdersDefinition],
    effects,
    designs,
});
