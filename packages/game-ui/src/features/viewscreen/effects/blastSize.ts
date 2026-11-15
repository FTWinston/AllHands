import { getShipSize, type ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';

/** How big a blast this kind of ship makes, where a small craft is 1. */
export function getBlastSize(appearance: ObjectAppearance) {
    switch (getShipSize(appearance)) {
        case 'small':
            return 1;
        case 'capital':
            return 3;
        default:
            return 1.7;
    }
}
