import { effectsEngine } from './general/effects/effects.engine';
import { encountersEngine } from './general/encounters/encounters.engine';
import { shipsEngine } from './general/ships/ships.engine';
import { sector1EngineContent } from './sectors/1/sector.engine';
import { sector2EngineContent } from './sectors/2/sector.engine';
import { sector3EngineContent } from './sectors/3/sector.engine';
import { engineerEngine } from './systems/engineer/engineer.engine';
import { helmEngine } from './systems/helm/helm.engine';
import { hullEngine } from './systems/hull/hull.engine';
import { reactorEngine } from './systems/reactor/reactor.engine';
import { deflectorsEngine } from './systems/science/deflectors/deflectors.engine';
import { scienceEngine } from './systems/science/science.engine';
import { tacticalEngine } from './systems/tactical/tactical.engine';

/**
 * Everything content gives the engine: how cards and status effects behave, and the ship designs, encounters and sectors, with the sectors in the order they're played.
 * The engine registers all of it when it starts (see `registerEngineContent`). Nothing else in the engine imports a content folder,
 * so leaving a sector out of this list leaves its code out of the build.
 */
export const engineContent = [
    reactorEngine,
    hullEngine,
    helmEngine,
    tacticalEngine,
    scienceEngine,
    deflectorsEngine,
    engineerEngine,
    effectsEngine,
    shipsEngine,
    encountersEngine,
    ...sector1EngineContent,
    ...sector2EngineContent,
    ...sector3EngineContent,
] as const;
