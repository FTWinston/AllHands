import { ObjectAppearance, capitalShipAppearances, smallCraftAppearances } from 'common-data/features/space/types/ObjectAppearance';

/** How big a blast this kind of ship makes, where a small craft is 1. */
export function getBlastSize(appearance: ObjectAppearance) {
    if ((smallCraftAppearances as readonly ObjectAppearance[]).includes(appearance)) {
        return 1;
    }

    return (capitalShipAppearances as readonly ObjectAppearance[]).includes(appearance) ? 3 : 1.7;
}
