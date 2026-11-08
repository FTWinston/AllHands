import { ScannedHullInfo } from 'common-data/features/space/types/GameObjectInfo';

/** How full a scanned ship's shields are, as a percentage of their capacity, or null if its hull hasn't been scanned. */
export function getShieldPercentage(scannedHull: Pick<ScannedHullInfo, 'shield' | 'maxShield'> | null | undefined): number | null {
    if (!scannedHull) {
        return null;
    }

    return scannedHull.maxShield > 0
        ? Math.round(scannedHull.shield / scannedHull.maxShield * 100)
        : 0;
}
