import { CardType, WeaponSlotTargetedCardType, WeaponTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getFiringSolution } from 'common-data/features/space/utils/getFiringSolution';
import { WeaponSlotState } from 'src/state/systems/tactical/WeaponSlotState';
import { CandidatePlay, CardEvaluator, EvaluationContext } from '../types';

export function targetRange(ctx: EvaluationContext): number | null {
    const targetId = ctx.blackboard.targetId;
    if (targetId === null || !ctx.ship.knownObjects.has(targetId)) {
        return null;
    }
    const target = ctx.gameState.objects.get(targetId);
    if (!target) {
        return null;
    }
    return getFiringSolution(ctx.ship.motion, target.motion, ctx.currentTime).range;
}

/** Charge decays in ~30s: charging far outside range wastes the play. */
function chargeScore(slot: WeaponSlotState, ctx: EvaluationContext): number {
    const range = targetRange(ctx);
    if (range === null) {
        return 8;
    }
    const maxRange = slot.getParameter('maxRange');
    if (range <= maxRange) {
        return 55;
    }
    if (range <= maxRange * 2) {
        return 30;
    }
    return 8;
}

export function weaponLoadEvaluator(cardType: WeaponSlotTargetedCardType): CardEvaluator {
    return (card, ctx) => {
        const cost = card.getParameter('cost');
        const out: CandidatePlay[] = [];
        for (const slot of ctx.ship.tacticalState.slots) {
            if (slot.card) {
                continue;
            }
            out.push({
                score: ctx.blackboard.targetId !== null ? 45 : 30,
                cost,
                action: { kind: 'playCard', cardId: card.id, cardType, targetType: 'weapon-slot', targetId: slot.id },
            });
        }
        return out;
    };
}

export function weaponModifierEvaluator(cardType: WeaponTargetedCardType, primeBias = 0, chargeBias = 0): CardEvaluator {
    return (card, ctx) => {
        const cost = card.getParameter('cost');
        const out: CandidatePlay[] = [];
        for (const slot of ctx.ship.tacticalState.slots) {
            if (!slot.card) {
                continue;
            }
            const action = { kind: 'playCard' as const, cardId: card.id, cardType: cardType as CardType, targetType: 'weapon' as const, targetId: slot.id };
            if (!slot.primed) {
                out.push({ score: 40 + primeBias, cost, action });
            } else if (!slot.isCharged()) {
                out.push({ score: chargeScore(slot, ctx) + chargeBias, cost, action });
            }
        }
        return out;
    };
}
