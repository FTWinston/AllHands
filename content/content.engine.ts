import { generalEngine } from './general/general.engine';
import { sector1EngineContent } from './sectors/sector1/sector.engine';
import { sector2EngineContent } from './sectors/sector2/sector.engine';
import { sector3EngineContent } from './sectors/sector3/sector.engine';
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
    ...generalEngine,
    ...sector1EngineContent,
    ...sector2EngineContent,
    ...sector3EngineContent,
] as const;
