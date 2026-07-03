import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { CandidatePlay, CardEvaluator, EvaluationContext } from '../types';
import { priorityFor } from './helpers';

/** Unmet demand on a system: how far its power sits below the highest active request. */
export function powerDeficit(system: ShipSystem, ctx: EvaluationContext): number {
    const request = ctx.blackboard.powerRequests.get(system);
    if (!request) {
        return 0;
    }
    const tile = ctx.ship.engineerState.systems.find(t => t.system === system);
    if (!tile) {
        return 0;
    }
    return Math.max(0, request.desiredLevel - tile.power);
}

/**
 * Power-boost cards share one shape: candidates only exist where demand exists.
 * No demand -> no candidates -> the card waits in hand. That is the reserve behaviour.
 */
export function powerBoostEvaluator(cardType: CardType, scorePerDeficit: number): CardEvaluator {
    return (card, ctx) => {
        const cost = card.getParameter('cost');
        const out: CandidatePlay[] = [];
        for (const tile of ctx.ship.engineerState.systems) {
            const deficit = powerDeficit(tile.system, ctx);
            if (deficit <= 0) {
                continue;
            }
            out.push({
                score: Math.min(90, deficit * scorePerDeficit * priorityFor(tile.system, ctx.config)),
                cost,
                action: { kind: 'playCard', cardId: card.id, cardType, targetType: 'system', targetId: tile.system },
            });
        }
        return out;
    };
}

const DISTRIBUTE_POWER_SCORE_PER_DEFICIT = 25;

/**
 * `distributePower` is a donor card: the mirror of `drawPower`. Its play function
 * (getEngineCardDefinition.ts) drains the *targeted* system Y by `powerChange * neighbours.length`
 * and gives each of Y's neighbours `powerChange` (see getAdjacentSystems for the 3x2 grid
 * adjacency it uses). So candidates here are keyed on the donor Y, not the beneficiary:
 *   - Y is only worth draining when at least one neighbour has unmet demand (powerDeficit > 0).
 *   - Y itself must not be the one asking for power - never drain a system that's asking for power.
 *   - Y must survive the drain: its power must stay at 1 or more afterwards, so donating power
 *     never fully disables the donor.
 * The score reflects how much requested deficit the play actually covers, priority-weighted per
 * benefiting neighbour, capped at 90 like the other power evaluators.
 */
export function distributePowerEvaluator(cardType: CardType): CardEvaluator {
    return (card, ctx) => {
        const cost = card.getParameter('cost');
        const powerChange = card.getParameter('powerChange');
        const engineer = ctx.ship.engineerState;
        const out: CandidatePlay[] = [];

        for (let index = 0; index < engineer.systems.length; index++) {
            const tile = engineer.systems[index];

            // Never drain a system that is itself asking for power.
            if (ctx.blackboard.powerRequests.has(tile.system)) {
                continue;
            }

            const neighbours = engineer.getAdjacentSystems(index);

            let coveredDeficit = 0;
            for (const neighbour of neighbours) {
                const deficit = powerDeficit(neighbour.system, ctx);
                if (deficit <= 0) {
                    continue;
                }
                coveredDeficit += Math.min(deficit, powerChange) * priorityFor(neighbour.system, ctx.config);
            }
            if (coveredDeficit <= 0) {
                continue;
            }

            // Donor safety floor: never drain a system down to 0 power.
            const loss = powerChange * neighbours.length;
            if (tile.power - loss < 1) {
                continue;
            }

            out.push({
                score: Math.min(90, coveredDeficit * DISTRIBUTE_POWER_SCORE_PER_DEFICIT),
                cost,
                action: { kind: 'playCard', cardId: card.id, cardType, targetType: 'system', targetId: tile.system },
            });
        }

        return out;
    };
}
