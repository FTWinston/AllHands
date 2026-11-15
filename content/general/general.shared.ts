import { appearancesShared } from './appearances/appearances.shared';
import { effectsShared } from './effects/effects.shared';
import { shipsShared } from './ships/ships.shared';

/** Everything the general module contributes to the shared content. */
export const generalShared = [effectsShared, shipsShared, appearancesShared] as const;
