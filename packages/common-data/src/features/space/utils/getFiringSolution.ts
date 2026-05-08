import { FiringSolution } from '../types/FiringSolution';
import { ReadonlyKeyframes } from '../types/Keyframes';
import { Position } from '../types/Position';
import { interpolatePosition } from './interpolate';
import { distance } from './vectors';

export function getFiringSolution(
    shooterMotion: ReadonlyKeyframes<Position>,
    targetMotion: ReadonlyKeyframes<Position>,
    currentTime: number
): FiringSolution {
    const shooterPosition = interpolatePosition(shooterMotion, currentTime);
    const targetPosition = interpolatePosition(targetMotion, currentTime);

    // TODO: Implement angle and bearing calculation based on shooterMotion and targetMotion
    return {
        range: distance(shooterPosition, targetPosition),
        relativeBearing: 0,
        targetAspect: 0,
    };
}
