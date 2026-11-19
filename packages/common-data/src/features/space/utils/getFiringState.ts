import { CardParametersBase } from '../../../features/cards/types/CardParameters';
import { cumbersomeAimTime } from '../../cards/utils/weaponTraitStats';
import { FiringSolution } from '../types/FiringSolution';
import { FiringState } from '../types/FiringState';
import { SubTargetInfo } from '../types/GameObjectInfo';
import { isFacingSubTarget } from './isFacingSubTarget.js';

export function getFiringState(
    firingSolution: FiringSolution | null,
    hasBeenFullyCharged: boolean,
    charge: number,
    parameters: CardParametersBase,
    subTarget?: SubTargetInfo,
    /** For a weapon that has to hold its aim (a cumbersome one): how long its target has been within its arc and range, in ms. Leave out for any other weapon. */
    aimedFor?: number
): FiringState {
    const chargePerUse = parameters['chargePerUse'] ?? 0;
    if (!hasBeenFullyCharged || charge <= 0 || charge < chargePerUse) {
        return FiringState.NotCharged;
    }

    if (!firingSolution) {
        return FiringState.NoTarget;
    }

    const maxRange = parameters['maxRange'] ?? 0;
    if (firingSolution.range > maxRange) {
        return FiringState.RangeTooFar;
    }

    const minRange = parameters['minRange'] ?? 0;
    if (firingSolution.range < minRange) {
        return FiringState.RangeTooClose;
    }

    const firingArc = parameters['firingArc'] ?? 0;
    if (Math.abs(firingSolution.relativeBearing) > firingArc) {
        return FiringState.RelativeBearingTooWide;
    }

    if (subTarget && !isFacingSubTarget(firingSolution.targetAspect, subTarget)) {
        return FiringState.TargetAspectObscured;
    }

    if (aimedFor !== undefined && aimedFor < cumbersomeAimTime) {
        return FiringState.Aiming;
    }

    return FiringState.CanFire;
}
