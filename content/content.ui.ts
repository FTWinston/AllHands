import { generalUi } from './general/general.ui';
import { sector1UiContent } from './sectors/sector1/sector.ui';
import { sector2UiContent } from './sectors/sector2/sector.ui';
import { sector3UiContent } from './sectors/sector3/sector.ui';
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
    ...generalUi,
    ...sector1UiContent,
    ...sector2UiContent,
    ...sector3UiContent,
] as const;
