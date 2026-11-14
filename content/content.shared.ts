import { effectsShared } from './general/effects/effects.shared';
import { sector1SharedContent } from './sectors/1/sector.shared';
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
    effectsShared,
    ...sector1SharedContent,
] as const;
