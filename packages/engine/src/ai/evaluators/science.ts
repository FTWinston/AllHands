import { DeflectorTargetCardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { CandidatePlay, CardEvaluator, EvaluationContext } from '../types';

const SCAN_SLOT_COUNT = 4;

/**
 * Deflector-slot loads for a dual-use science card. Near-worthless (4) until the commander
 * publishes a vulnerabilityPlan combo to complete — then matching slots score 60.
 * (The EXPOSE→EXPLOIT pipeline is stubbed in the engine; the plan stays null for now.)
 */
function deflectorSlotCandidates(cardId: number, cardType: CardType, cost: number, ctx: EvaluationContext): CandidatePlay[] {
    const definition = getCardDefinition(cardType) as DeflectorTargetCardDefinition;
    const plan = ctx.blackboard.vulnerabilityPlan;
    const out: CandidatePlay[] = [];

    const slots = [
        ['modifier', definition.modifier ?? null],
        ['substance', definition.substance ?? null],
        ['delivery', definition.delivery ?? null],
    ] as const;

    for (const [slotId, property] of slots) {
        if (property === null) {
            continue;
        }
        const score = plan !== null && plan[slotId] === property ? 60 : 4;
        out.push({
            score,
            cost,
            action: { kind: 'playCard', cardId, cardType, targetType: 'deflector', targetId: slotId },
        });
    }
    return out;
}

export const scanEvaluator: CardEvaluator = (card, ctx) => {
    const cost = card.getParameter('cost');
    const out: CandidatePlay[] = [];

    const targetId = ctx.blackboard.targetId;
    if (targetId !== null && ctx.ship.knownObjects.has(targetId)) {
        const identified = ctx.ship.scienceState.systemOrderByTarget.get(targetId);
        for (let slot = 0; slot < SCAN_SLOT_COUNT; slot++) {
            if (identified && identified.order[slot]) {
                continue; // already identified — scanning it again teaches nothing new
            }
            out.push({
                score: 50 - slot, // slight ordering bias keeps the choice stable
                cost,
                action: { kind: 'playCard', cardId: card.id, cardType: 'scan', targetType: 'enemy', targetId: `${targetId}:${slot}` },
            });
        }
    }

    out.push(...deflectorSlotCandidates(card.id, 'scan', cost, ctx));
    return out;
};

/** Deflector-slot only: these cards' enemy plays are engine stubs (return true, no effect). */
export function deflectorOnlyEvaluator(cardType: CardType): CardEvaluator {
    return (card, ctx) => deflectorSlotCandidates(card.id, cardType, card.getParameter('cost'), ctx);
}
