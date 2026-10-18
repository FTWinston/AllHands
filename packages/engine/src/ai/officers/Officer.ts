import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { CardState } from 'src/state/CardState';
import { GameState } from 'src/state/GameState';
import { Ship } from 'src/state/Ship';
import { CrewSystemState } from 'src/state/systems/CrewSystemState';
import { getCardEvaluator, warnMissingEvaluator } from '../evaluators';
import { AiRole, Blackboard, CandidateAction, CandidatePlay, EvaluationContext, ResolvedAiConfig, SKILL_NOISE_SCALE, SKILL_SKIP_CHANCE } from '../types';

export const PLAY_THRESHOLD = 20;
export const SWITCHING_COST = 15;
export const POWER_REQUEST_DURATION = 5000;

export abstract class Officer {
    constructor(
        protected readonly ship: Ship,
        protected readonly gameState: GameState,
        protected readonly config: ResolvedAiConfig
    ) {}

    abstract readonly role: AiRole;

    protected getSystem(): CrewSystemState {
        return this.ship.getSystem(this.role) as CrewSystemState;
    }

    /** Non-card actions this officer always considers (fire weapons, repair, ...). */
    protected standingCandidates(_ctx: EvaluationContext): CandidatePlay[] {
        return [];
    }

    /** Called every tick, for follow-up actions that shouldn't wait for the next think. */
    update(_currentTime: number): void {}

    think(blackboard: Blackboard, currentTime: number): void {
        const skill = this.config.skill;
        const random = this.gameState.random;

        // Low-skill crews sometimes do nothing at all: forgotten repairs, missed firing windows.
        if (skill < 1 && random.getBoolean(SKILL_SKIP_CHANCE * (1 - skill))) {
            return;
        }

        const system = this.getSystem();
        const ctx: EvaluationContext = {
            ship: this.ship,
            gameState: this.gameState,
            blackboard,
            system,
            currentTime,
            config: this.config,
        };

        const candidates: CandidatePlay[] = [...this.standingCandidates(ctx)];
        for (const card of system.hand) {
            const evaluator = getCardEvaluator(card.type);
            if (!evaluator) {
                warnMissingEvaluator(card.type);
                continue;
            }
            candidates.push(...evaluator(card, ctx));
        }

        // Shallow-copy before adjusting scores: evaluators return fresh objects today, but
        // mutating candidate.score in place would silently corrupt any cached/shared objects
        // a future standingCandidates implementation might return.
        const scored = candidates.map(candidate => ({ ...candidate }));

        for (const candidate of scored) {
            if (candidate.interrupts) {
                candidate.score -= SWITCHING_COST;
            }
            if (skill < 1) {
                // Low skill perceives wrong scores; suboptimal choices follow naturally.
                candidate.score += random.getFloat(-1, 1) * SKILL_NOISE_SCALE * (1 - skill);
            }
        }

        scored.sort((a, b) => b.score - a.score);

        const threshold = PLAY_THRESHOLD / this.config.priorities[this.role];

        for (const candidate of scored) {
            if (candidate.score < threshold) {
                return; // Everything below the threshold isn't worth acting on: wait.
            }

            if (candidate.cost > system.maxPowerLevel) {
                continue; // No amount of extra power makes this affordable, so don't ask for any.
            }

            if (candidate.cost > system.powerLevel) {
                // Worth playing but unaffordable: signal demand to the engineer, try the next candidate.
                // Always refresh the expiry while the need persists, so a steady demand doesn't
                // lapse and go dark between thinks.
                const requestSystem: ShipSystem = this.role;
                const existing = blackboard.powerRequests.get(requestSystem);
                blackboard.powerRequests.set(requestSystem, {
                    desiredLevel: Math.max(existing?.desiredLevel ?? 0, candidate.cost),
                    expires: currentTime + POWER_REQUEST_DURATION,
                });
                continue;
            }

            this.execute(candidate.action);
            return; // One play per think.
        }
    }

    /** The card whose best current candidate scores lowest, among those that can be spent on a capacity meter and pass the optional filter. */
    protected findWorstCard(ctx: EvaluationContext, filter?: (card: CardState) => boolean): CardState | null {
        let worst: CardState | null = null;
        let worstScore = Infinity;
        for (const card of ctx.system.hand) {
            if (card.isDamaged || (getCardDefinition(card.type).traits ?? []).includes('expendable') || (filter && !filter(card))) {
                continue;
            }
            const evaluator = getCardEvaluator(card.type);
            const best = evaluator ? Math.max(0, ...evaluator(card, ctx).map(c => c.score)) : 0;
            if (best < worstScore) {
                worstScore = best;
                worst = card;
            }
        }
        return worst;
    }

    protected execute(action: CandidateAction): void {
        switch (action.kind) {
            case 'playCard':
                this.getSystem().playCard(action.cardId, action.cardType, action.targetType, action.targetId);
                break;
            case 'repair':
                this.ship.engineerState.repair(action.system);
                break;
            case 'chargeWeaponSlot':
                this.ship.tacticalState.chargeWeaponSlot(action.cardId, action.slotId);
                break;
        }
    }
}
