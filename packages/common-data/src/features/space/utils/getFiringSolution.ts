import { FiringSolution } from '../types/FiringSolution';
import { ReadonlyKeyframes } from '../types/Keyframes';
import { Position } from '../types/Position';
import { interpolatePosition } from './interpolate';
import { clampAngle, determineAngle, distance } from './vectors';

export function getFiringSolution(
    shooterMotion: ReadonlyKeyframes<Position>,
    targetMotion: ReadonlyKeyframes<Position>,
    currentTime: number
): FiringSolution {
    const shooterPosition = interpolatePosition(shooterMotion, currentTime);
    const targetPosition = interpolatePosition(targetMotion, currentTime);

    const shooterToTargetAngle = determineAngle(shooterPosition, targetPosition);
    const targetToShooterAngle = determineAngle(targetPosition, shooterPosition);

    return {
        range: distance(shooterPosition, targetPosition),
        relativeBearing: clampAngle(shooterToTargetAngle - shooterPosition.angle),
        targetAspect: clampAngle(targetToShooterAngle - targetPosition.angle - Math.PI), // Subtract an extra pi, cos 0 means target's stern is facing the shooter, not its bow.
    };
}
