import { effectsUi } from './general/effects/effects.ui';
import { sector1UiContent } from './sectors/1/sector.ui';
import { engineerUi } from './systems/engineer/engineer.ui';
import { helmUi } from './systems/helm/helm.ui';
import { hullUi } from './systems/hull/hull.ui';
import { reactorUi } from './systems/reactor/reactor.ui';
import { deflectorsUi } from './systems/science/deflectors/deflectors.ui';
import { scienceUi } from './systems/science/science.ui';
import { tacticalUi } from './systems/tactical/tactical.ui';

/**
 * Everything content gives the clients: what each card and status effect is called, and how it's described and drawn.
 * Each client registers all of it when it starts (see `registerUiContent`).
 */
export const uiContent = [
    reactorUi,
    hullUi,
    helmUi,
    tacticalUi,
    scienceUi,
    deflectorsUi,
    engineerUi,
    effectsUi,
    ...sector1UiContent,
] as const;
