import { generalShared } from './general/general.shared';
import { sector1SharedContent } from './sectors/sector1/sector.shared';
import { sector2SharedContent } from './sectors/sector2/sector.shared';
import { sector3SharedContent } from './sectors/sector3/sector.shared';
import { engineerShared } from './systems/engineer/engineer.shared';
import { helmShared } from './systems/helm/helm.shared';
import { hullShared } from './systems/hull/hull.shared';
import { reactorShared } from './systems/reactor/reactor.shared';
import { deflectorsShared } from './systems/science/deflectors/deflectors.shared';
import { scienceShared } from './systems/science/science.shared';
import { tacticalShared } from './systems/tactical/tactical.shared';

/**
 * Every content folder's cards and status effects, which common-data puts together as `cardDefinitions` and `systemEffectDefinitions`.
 * Each must also be given its behaviour in `content.engine.ts`, and its look in `content.ui.ts`.
 */
export const sharedContent = [
    reactorShared,
    hullShared,
    helmShared,
    tacticalShared,
    scienceShared,
    deflectorsShared,
    engineerShared,
    ...generalShared,
    ...sector1SharedContent,
    ...sector2SharedContent,
    ...sector3SharedContent,
] as const;
