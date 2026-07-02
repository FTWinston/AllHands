import { SubTargetInfo } from '../types/GameObjectInfo';

export function isFacingSubTarget(
    aspect: number,
    subTarget: SubTargetInfo
): boolean {
    return subTarget.aspect === null || Math.abs(subTarget.aspect - aspect) <= 2 * Math.PI / 3;
}
