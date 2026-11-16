import { appearancesUi } from './appearances/appearances.ui';
import { effectsUi } from './effects/effects.ui';
import { shipsUi } from './ships/ships.ui';
import { weaponTraitsUi } from './weaponTraits/weaponTraits.ui';

/** Everything the general module contributes to the UI content. */
export const generalUi = [effectsUi, weaponTraitsUi, shipsUi, appearancesUi] as const;
