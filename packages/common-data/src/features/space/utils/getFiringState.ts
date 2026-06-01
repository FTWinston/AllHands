import { CardParametersBase } from '../../../features/cards/types/CardParameters';
import { FiringSolution } from '../types/FiringSolution';
import { FiringState } from '../types/FiringState';
import { VulnerabilityInfo } from '../types/GameObjectInfo';
import { isFacingVulnerability } from './isFacingVulnerability';

export function getFiringState(
    firingSolution: FiringSolution | null,
    primed: boolean,
    charge: number,
    parameters: CardParametersBase,
    vulnerability?: VulnerabilityInfo
): FiringState {
    if (!primed) {
        return FiringState.NotPrimed;
    }

    const chargeCost = parameters['chargeCost'] ?? 0;
    if (charge < chargeCost) {
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

    if (vulnerability && !isFacingVulnerability(firingSolution.targetAspect, vulnerability)) {
        return FiringState.TargetAspectObscured;
    }

    return FiringState.CanFire;
}
