import { defineEngineContent } from 'engine/content/EngineContent';
import { bossDefinition } from './BossEncounter.engine';
import { combatEncounterDefinitions } from './CombatEncounters.engine';
import { surviveDefinition } from './SurviveEncounter.engine';
import type { EncounterId } from 'common-data/features/sectors/types/SectorNodeInfo';

/** Placeholder fights, which every sector has for now. An encounter listed more than once turns up more often. */
export const placeholderEncounters: { early: readonly EncounterId[]; late: readonly EncounterId[] } = {
    early: ['skirmish', 'ambush', 'survive'],
    late: ['assault', 'escort', 'survive', 'ambush'],
};

// Defined apart from the content, as the escorts' designs are worked out from the content (see `ShipDesign`).
const bossA = bossDefinition('bossA', 'Placeholder Boss A', 'asteroidField', { bossName: 'Boss A', escorts: ['harrier', 'harrier'] });

export const encountersEngine = defineEngineContent({
    encounters: [...combatEncounterDefinitions, surviveDefinition, bossA],
});
