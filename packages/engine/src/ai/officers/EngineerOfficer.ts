import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { priorityFor } from '../evaluators/helpers';
import { CandidatePlay, EvaluationContext } from '../types';
import { Officer } from './Officer';

const REPAIR_TRIGGER_CAPACITY = 10;
const CYCLE_SCORE = 25;

export class EngineerOfficer extends Officer {
    readonly role = 'engineer' as const;

    protected override standingCandidates(ctx: EvaluationContext): CandidatePlay[] {
        const out: CandidatePlay[] = [];
        const engineer = this.ship.engineerState;

        // Repair the most damaged (priority-weighted) system once capacity is worth spending.
        if (engineer.repairCapacity >= REPAIR_TRIGGER_CAPACITY) {
            let bestSystem: ShipSystem | null = null;
            let bestScore = 0;
            for (const tile of engineer.systems) {
                const maxHealth = tile.systemState.maxHealth;
                const fraction = maxHealth > 0 ? 1 - tile.health / maxHealth : 0;
                const score = fraction * 100 * priorityFor(tile.system, ctx.config);
                if (fraction > 0 && score > bestScore) {
                    bestScore = score;
                    bestSystem = tile.system;
                }
            }
            if (bestSystem !== null) {
                out.push({ score: Math.min(95, bestScore), cost: 0, action: { kind: 'repair', system: bestSystem } });
            }
        }

        // Hand pressure: convert the least useful card into repair capacity rather than clogging the hand.
        const system = ctx.system;
        if (system.hand.length >= system.maxHandSize && engineer.repairCapacity < engineer.maxRepairCapacity) {
            const worst = this.findWorstCard(ctx);
            if (worst) {
                out.push({
                    score: CYCLE_SCORE,
                    cost: worst.getParameter('cost'),
                    action: { kind: 'playCard', cardId: worst.id, cardType: worst.type, targetType: 'system', targetId: 'repair' },
                });
            }
        }

        return out;
    }
}
