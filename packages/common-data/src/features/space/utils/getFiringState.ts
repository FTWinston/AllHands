import { CardParameters } from '../../../features/cards/types/CardParameters';
import { resolveParameter } from '../../../features/cards/utils/resolveParameters';
import { MinimalReadonlyMap } from '../../../types/MinimalArray';
import { FiringSolution } from '../types/FiringSolution';
import { FiringState } from '../types/FiringState';

export function getFiringState(
    firingSolution: FiringSolution | null,
    primed: boolean,
    charge: number,
    parameters: CardParameters,
    modifiers?: MinimalReadonlyMap<string, number>
): FiringState {
    if (!primed) {
        return FiringState.NotPrimed;
    }

    const chargeCost = resolveParameter('chargeCost', parameters, modifiers);
    if (charge < chargeCost) {
        return FiringState.NotCharged;
    }

    if (!firingSolution) {
        return FiringState.NoTarget;
    }

    const maxRange = resolveParameter('maxRange', parameters, modifiers);
    if (firingSolution.range > maxRange) {
        return FiringState.RangeTooFar;
    }

    const minRange = resolveParameter('minRange', parameters, modifiers);
    if (firingSolution.range < minRange) {
        return FiringState.RangeTooClose;
    }

    const firingArc = resolveParameter('firingArc', parameters, modifiers);
    if (Math.abs(firingSolution.relativeBearing) > firingArc) {
        return FiringState.RelativeBearingTooWide;
    }

    return FiringState.CanFire;
}
