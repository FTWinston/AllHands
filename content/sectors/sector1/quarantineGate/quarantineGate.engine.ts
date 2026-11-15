import { defineEngineContent } from 'engine/content/EngineContent';
import { cards } from './cards/quarantineGateCards.engine';
import { effects } from './effects/quarantineGateEffects.engine';
import { quarantineGateShared } from './quarantineGate.shared';
import { QuarantineGateEncounter, boardingMs, quarantineGateDefinition } from './QuarantineGateEncounter.engine';
import { designs } from './ships/quarantineGateShips.engine';

export { QuarantineGateEncounter, boardingMs };

export const quarantineGateEngine = defineEngineContent({
    shared: quarantineGateShared,
    encounters: [quarantineGateDefinition],
    cards,
    effects,
    designs,
});
