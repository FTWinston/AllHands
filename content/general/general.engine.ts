import { effectsEngine } from './effects/effects.engine';
import { bossDefinition } from './encounters/BossEncounter.engine';
import { encountersEngine, placeholderEncounters } from './encounters/encounters.engine';
import { defaultSurviveDurationMs } from './encounters/SurviveEncounter.engine';
import { fighterTemplate, shipsEngine } from './ships/ships.engine';

/** Everything the general module contributes to the engine. */
export const generalEngine = [effectsEngine, shipsEngine, encountersEngine] as const;
export { bossDefinition, defaultSurviveDurationMs, fighterTemplate, placeholderEncounters };
